use std::{collections::HashMap, future::Future, pin::Pin};

use ic_ledger_types::{AccountIdentifier, BlockIndex, Memo, Tokens, TransferArgs, MAINNET_LEDGER_CANISTER_ID};

use crate::TOKEN_SUBACCOUNTS;

use super::{Intent, IntentStatus, IntentType, SupportedNetwork};

pub(crate) trait BlockchainAdapter {
    fn network(&self) -> SupportedNetwork;
    fn token(&self) -> String;
    fn intent_type(&self) -> IntentType;
    fn execute<'a>(&'a self, intent: &'a Intent) -> Pin<Box<dyn Future<Output = Result<IntentStatus, String>> + 'a>>;
}

type Token = String;

pub struct BlockchainExecutionManager {
    // Key is ${token-network}
    pub(crate) adapters: HashMap<String, Box<dyn BlockchainAdapter>>,
}

impl BlockchainExecutionManager {
    pub fn new() -> BlockchainExecutionManager {
        BlockchainExecutionManager {
            adapters: HashMap::new(),
        }
    }

    pub fn add_adapter(&mut self, adapter: Box<dyn BlockchainAdapter>) {
        let s: &'static str = adapter.network().into();
        let it: &'static str = adapter.intent_type().into();
        self.adapters.insert([adapter.token(), s.to_string(), it.to_string()].join("-"), adapter);
    }

    pub async fn execute(&self, intent: &Intent) -> Result<IntentStatus, String> {
        let network: &'static str = intent.network().into();
        let it: &'static str = intent.intent_type().into();
        let key = [intent.token(), network.to_string(), it.to_string()].join("-");
        let adapter = self.adapters.get(&key).unwrap();
        adapter.execute(intent).await
    }
}

pub struct ICPNativeTransferAdapter {
    pub(crate) network: SupportedNetwork,
    pub(crate) token: Token,
    pub(crate) intent_type: IntentType,
}

type ICPNativeTransferArgs = TransferArgs;

/**
 * See TransferArgs in ic_ledger_types
 */
const RECOMMENDED_TRANSACTION_FEE: u64 = 10000;

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
                list_ref.borrow().get(&intent.token()).unwrap().clone()
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
                Ok(_) => Ok(IntentStatus::Completed),
                Err(e) => Err(e.to_string()),
            }
        })
    }
}

impl ICPNativeTransferAdapter {
    fn new() -> ICPNativeTransferAdapter {
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

