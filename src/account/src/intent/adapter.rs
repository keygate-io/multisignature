use std::{collections::HashMap, future::Future, pin::Pin, str::FromStr};

use candid::{Nat, Principal};
use dyn_clone::DynClone;
use ic_cdk::api::call::CallResult;
use ic_ledger_types::{AccountIdentifier, BlockIndex, Memo, Tokens, TransferArgs, MAINNET_LEDGER_CANISTER_ID};
use icrc_ledger_types::icrc1::{account::Account, transfer::{TransferArg as ICRC1TransferArgs, TransferError}};
use serde_bytes::ByteBuf;

use crate::{ADAPTERS, TOKEN_ACCOUNTS, TOKEN_SUBACCOUNTS};

use super::{Intent, IntentStatus, IntentType, SupportedNetwork};

pub(crate) trait BlockchainAdapter: DynClone {
    fn network(&self) -> SupportedNetwork;
    fn token(&self) -> String;
    fn intent_type(&self) -> IntentType;
    fn execute<'a>(&'a self, intent: &'a Intent) -> Pin<Box<dyn Future<Output = Result<IntentStatus, String>> + 'a>>;
}

dyn_clone::clone_trait_object!(BlockchainAdapter);

type Token = String;

pub fn add_adapter(adapter: Box<dyn BlockchainAdapter>) {
    let s: &'static str = adapter.network().into();
    let it: &'static str = adapter.intent_type().into();
    let key = [adapter.token(), s.to_string(), it.to_string()].join("-");
    ADAPTERS.with(|adapters| {
        adapters.borrow_mut().insert(key, adapter);
    });
}

pub async fn execute(intent: &Intent) -> IntentStatus {
    let network: &'static str = intent.network().into();
    let it: &'static str = intent.intent_type().into();
    let key = format!("{}-{}-{}", intent.token(), network, it);
    
    let adapter = ADAPTERS.with(|adapters: &std::cell::RefCell<HashMap<String, Box<dyn BlockchainAdapter>>>| {
        dyn_clone::clone_box(adapters.borrow().get(&key).expect("Error getting adapter").as_ref())
    });

    match adapter.execute(intent).await {
        Ok(status) => status,
        Err(e) => {
            println!("Error executing intent: {}", e);
            IntentStatus::Failed(e)
        }
    }
}

#[derive(Clone)]
pub struct ICPNativeTransferAdapter {
    pub(crate) network: SupportedNetwork,
    pub(crate) token: Token,
    pub(crate) intent_type: IntentType,
}

type ICPNativeTransferArgs = TransferArgs;

/**
 * See TransferArgs in ic_ledger_types
 */
const RECOMMENDED_TRANSACTION_FEE: u64 = 1000000; 


impl BlockchainAdapter for ICPNativeTransferAdapter {
    fn network(&self) -> SupportedNetwork {
        self.network.clone()
    }

    fn token(&self) -> String {
        self.token.clone()
    }

    fn intent_type(&self) -> IntentType {
        self.intent_type.clone()
    }

    fn execute<'a>(&'a self, intent: &'a Intent) -> Pin<Box<dyn Future<Output = Result<IntentStatus, String>> + 'a>> {
        Box::pin(async move {
            println!("Executing ICPAdapter");
            let subaccount = TOKEN_SUBACCOUNTS.with(|list_ref| {
                list_ref.borrow().get(&intent.token().0).unwrap().clone()
            });

            let args = ICPNativeTransferArgs {
                to: AccountIdentifier::from_hex(intent.to().as_str()).unwrap(),
                amount: Tokens::from_e8s(intent.amount()),
                fee: Tokens::from_e8s(RECOMMENDED_TRANSACTION_FEE),
                memo: Memo(0),
                from_subaccount: Some(subaccount),
                created_at_time: None,
            };

            match ICPNativeTransferAdapter::transfer(args).await {
                Ok(_) => Ok(IntentStatus::Completed("Successfully transferred native ICP.".to_string())),
                Err(e) => Err(e.to_string()),
            }
        })
    }
}

impl ICPNativeTransferAdapter {
    pub fn new() -> ICPNativeTransferAdapter {
        ICPNativeTransferAdapter {
            network: SupportedNetwork::ICP,
            token: "ICP".to_string(),
            intent_type: IntentType::Transfer,
        }
    }

    async fn transfer(args: ICPNativeTransferArgs) -> Result<BlockIndex, String> {
        match ic_ledger_types::transfer(MAINNET_LEDGER_CANISTER_ID, args).await {
            Ok(Ok(block_index)) => return Ok(block_index),
            Ok(Err(transfer_error)) => {
                let error_message = format!("transfer error: {:?}", transfer_error);
                Err(error_message)
            }
            Err((error, message)) => {
                let error_message = format!("unexpected error: {:?}, message: {}", error, message);
                Err(error_message)
            }
        }
    }
}

#[derive(Clone)]
struct ICRC1TransferAdapter {
    pub(crate) network: SupportedNetwork,
    pub(crate) token: Token,
    pub(crate) intent_type: IntentType,
}

impl BlockchainAdapter for ICRC1TransferAdapter {
    fn network(&self) -> SupportedNetwork {
        self.network.clone()
    }

    fn token(&self) -> String {
        self.token.clone()
    }

    fn intent_type(&self) -> IntentType {
        self.intent_type.clone()
    }

    fn execute<'a>(&'a self, intent: &'a Intent) -> Pin<Box<dyn Future<Output = Result<IntentStatus, String>> + 'a>> {
        Box::pin(async move {
            println!("Executing ICRC1Adapter");
            let icrc_account = TOKEN_ACCOUNTS.with(|list_ref| {
                list_ref.borrow().get(&intent.token().0).unwrap().clone()
            });

            let args = ICRC1TransferArgs {
                to: ICRC1TransferAdapter::extract_owner_and_subaccount(intent.to().as_str()),
                amount: Nat::from(intent.amount()),
                fee: Some(Nat::from(RECOMMENDED_TRANSACTION_FEE)),
                memo: Some(icrc_ledger_types::icrc1::transfer::Memo(ByteBuf::from(vec![]))),
                from_subaccount: Some(icrc_account),
                created_at_time: None,
            };

            match self.transfer(args).await {
                // TODO: include the name or symbol of the token
                Ok(_) => Ok(IntentStatus::Completed("Successfully transferred an ICRC-1 token.".to_string())),
                Err(e) => Err(e.to_string()),
            }
        })
    }
}

impl ICRC1TransferAdapter {
    pub fn extract_owner_and_subaccount(to: &str) -> Account {
        let to_parts: Vec<&str> = to.split('.').collect();
        let owner = Principal::from_str(to_parts[0]).unwrap();
        let subaccount = to_parts[1].as_bytes();

        if subaccount.len() != 32 {
            panic!("Subaccount must be 32 bytes");
        }

        Account {
            owner,
            subaccount: Some(subaccount.try_into().unwrap()),
        }
    }

    pub fn extract_token_identifier(token: Token) -> Result<String, String> {
        let parts: Vec<&str> = token.split(':').collect();
        if parts.len() != 3 {
            return Err("Invalid token format".to_string());
        }
        Ok(parts[2].to_string())
    }

    async fn transfer(&self, args: ICRC1TransferArgs) -> Result<Nat, String> {
        let token_identifier  = ICRC1TransferAdapter::extract_token_identifier(self.token())?;
        let principal = Principal::from_slice(&token_identifier.as_bytes());
        let transfer_result: CallResult<(Result<Nat, TransferError>,)> = ic_cdk::call(principal, "icrc1_transfer", (args,)).await;
        match transfer_result {
            Ok((inner_result,)) => match inner_result {
                Ok(block_index) => Ok(block_index),
                Err(transfer_error) => Err(format!("ICRC-1 transfer error: {:?}", transfer_error)),
            },
            Err((rejection_code, message)) => {
                Err(format!("Canister call rejected: {:?} - {}", rejection_code, message))
            }
        }
    }
}
