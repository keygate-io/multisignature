use std::{collections::HashMap, future::Future, pin::Pin, str::FromStr};

use candid::{CandidType, Nat, Principal};
use dyn_clone::DynClone;
use ic_cdk::api::call::CallResult;
use ic_ledger_types::{AccountIdentifier, BlockIndex, Memo, Tokens, TransferArgs, MAINNET_LEDGER_CANISTER_ID};
use icrc_ledger_types::icrc1::{account::Account, transfer::{TransferArg as ICRC1TransferArgs, TransferError}};
use serde_bytes::ByteBuf;

use crate::{ADAPTERS, TOKEN_ACCOUNTS, TOKEN_SUBACCOUNTS};

use std::{borrow::Cow, collections::LinkedList, fmt::{self, Display}};

use ic_cdk::{query, update};
use ic_stable_structures::{storable::Bound, Storable};
use serde::{Deserialize, Serialize};

use crate::{DECISIONS, INTENTS};

pub(crate) trait BlockchainAdapter: DynClone {
    fn network(&self) -> SupportedNetwork;
    fn token(&self) -> String;
    fn intent_type(&self) -> IntentType;
    fn execute<'a>(&'a self, intent: &'a Intent) -> Pin<Box<dyn Future<Output = Result<IntentStatus, String>> + 'a>>;
}

dyn_clone::clone_trait_object!(BlockchainAdapter);

type TokenPath = String;

pub async fn execute(intent: &Intent) -> IntentStatus {
    let it: &'static str = intent.intent_type().into();
    let key = format!("{}:{}", intent.token(), it);
    
    let adapter = ADAPTERS.with(|adapters: &std::cell::RefCell<HashMap<String, Box<dyn BlockchainAdapter>>>| {
        dyn_clone::clone_box(adapters.borrow().get(&key).expect(&format!("Adapter not found for {}", key)))
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
    pub(crate) token: TokenPath,
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

    fn token(&self) -> TokenPath {
        self.token.clone()
    }

    fn intent_type(&self) -> IntentType {
        self.intent_type.clone()
    }

    fn execute<'a>(&'a self, intent: &'a Intent) -> Pin<Box<dyn Future<Output = Result<IntentStatus, String>> + 'a>> {
        Box::pin(async move {
            println!("Executing ICPAdapter");
            let subaccount = TOKEN_SUBACCOUNTS.with(|list_ref| {
                list_ref.borrow().get(&intent.token()).unwrap()
            });

            let args = ICPNativeTransferArgs {
                to: AccountIdentifier::from_hex(intent.to().as_str()).unwrap(),
                amount: Tokens::from_e8s(intent.amount()),
                fee: Tokens::from_e8s(RECOMMENDED_TRANSACTION_FEE),
                memo: Memo(0),
                from_subaccount: Some(subaccount.0),
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
            token: "icp:native".to_string(),
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
    pub(crate) token: TokenPath,
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
                list_ref.borrow().get(&intent.token()).unwrap().clone()
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

    pub fn extract_token_identifier(token: TokenPath) -> Result<String, String> {
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



#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq, strum_macros::IntoStaticStr)]
pub enum IntentType {
    Swap,
    Transfer,
}

#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq, strum_macros::IntoStaticStr)]
pub enum IntentStatus {
    Pending(String),
    InProgress(String),
    Completed(String),
    Rejected(String),
    Failed(String),
}

#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq, strum_macros::IntoStaticStr)]
pub enum SupportedNetwork {
    ICP,
    ETH
}

// Formats for tokens:
// icp:native
// icp:icrc1:<principal_id>
// eth:{erc20}:{0x0000000000000000000000000000000000000000}
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub struct Token(pub String);

impl Display for Token {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}


/// Represents an intent for a blockchain transaction.
///
/// An `Intent` encapsulates all the necessary information for executing
/// a transaction on a supported blockchain network.
///
/// # Fields
///
/// * `intent_type` - The type of the intent (e.g., transfer, swap).
/// * `amount` - The amount of tokens involved in the transaction.
/// * `token` - The token identifier for the transaction. For native ICP, it's "ICP:native". For ICRC-1 tokens, it's "ICP:<icrc_standard>:<principal_id>". For ETH, it's "eth:<token_standard>:<token_address>".
/// * `to` - The recipient's address or identifier. For ICP and ICRC-1 tokens, it's in the format <principal_id>.<subaccount_id>, where subaccount_id is Base32 encoded. For ETH, it's the address of the recipient.
/// * `from` - The sender's address or identifier. For ICP and ICRC-1 tokens, it's in the format <principal_id>.<subaccount_id>, where subaccount_id is Base32 encoded. For ETH, it's the address of the sender.
/// * `network` - The blockchain network on which the transaction should occur.
/// * `status` - The current status of the intent.
///
/// # Examples
///
/// ```
/// use intent::{Intent, IntentType, Token, SupportedNetwork, IntentStatus};
/// use ic_cdk::export::Principal;
///
/// let principal = Principal::from_text("l4sux-ovcbh-qjlir-sij5b-xffaa-uydtf-zlwgz-ezskj-zlar3-4ap3v-2qe").unwrap();
/// let subaccount = [0u8; 32];  // Example subaccount
/// let to_address = account_to_string(&principal, Some(&subaccount));
///
/// let intent = Intent {
///     intent_type: IntentType::Transfer,
///     amount: 1000000,
///     token: Token("icp:icrc1:z3hc7-f3wle-sfb34-ftgza-o7idl-vopan-733dp-5s6vi-wy4zo-tzwmv-4ae".to_string()),
///     to: to_address,
///     from: "from_address_here".to_string(),
///     network: SupportedNetwork::ICP,
///     status: IntentStatus::Pending,
/// };
/// ```
#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub struct Intent {
    pub intent_type: IntentType,
    pub amount: u64,
    pub token: TokenPath,
    pub to: String,
    pub from: String,
    pub network: SupportedNetwork,
    pub status: IntentStatus
}

impl Intent {
    pub fn network(&self) -> SupportedNetwork {
        self.network.clone()
    }

    pub fn token(&self) -> TokenPath {
        self.token.clone()
    }

    pub fn intent_type(&self) -> IntentType {
        self.intent_type.clone()
    }

    pub fn status(&self) -> IntentStatus {
        self.status.clone()
    }

    pub fn from(&self) -> String {
        self.from.clone()
    }

    pub fn to(&self) -> String {
        self.to.clone()
    }

    pub fn amount(&self) -> u64 {
        self.amount
    }
    
}

impl Storable for Intent {
    const BOUND: Bound = Bound::Bounded {
        max_size: 1024,
        is_fixed_size: false,
    };

    fn to_bytes(&self) -> Cow<[u8]> {
        let serialized = serde_cbor::to_vec(self).expect("Serialization failed");
        Cow::Owned(serialized)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        let deserialized: Intent = serde_cbor::from_slice(&bytes.to_vec()).unwrap();
        deserialized
    }
}

#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub struct Decision {
    id: u64,
    intent_id: u64,
    signee: Principal,
    approved: bool
}

impl Decision {
    pub fn new(id: u64, intent_id: u64, signee: Principal, approved: bool) -> Decision {
        Decision {
            id,
            intent_id,
            signee,
            approved
        }
    }

    pub fn id(&self) -> u64 {
        self.id
    }

    pub fn approved(&self) -> bool {
        self.approved
    }
}

#[query]
pub fn get_adapters() -> Vec<String> {
    ADAPTERS.with(|adapters| {
        adapters.borrow().keys().cloned().collect()
    })
}

#[update]
pub fn add_intent(intent: Intent) -> u64 {
    let mut id = 0;

    INTENTS.with(|intents| {
        id = intents.borrow().len();
        let intents = intents.borrow_mut();
        intents.append(&intent).expect("Failed to add intent");
    });

    id
}

#[update]
pub fn add_decision(decision: Decision) {
    // TODO: Guard checking internet identity
    DECISIONS.with(|decisions| {
        let mut decisions = decisions.borrow_mut();
        let decision_list = decisions.entry(decision.intent_id).or_insert(LinkedList::new());
        decision_list.push_back(decision);
    });
}

#[query]
pub fn get_intents() -> Vec<Intent> {
    INTENTS.with(|intents| {
        let intents = intents.borrow();
        intents.iter().collect()
    })
}

#[query]
pub fn get_decisions(intent_id: u64) -> LinkedList<Decision> {
    DECISIONS.with(|decisions| {
        let decisions = decisions.borrow();
        match decisions.get(&intent_id) {
            Some(decision_list) => decision_list.clone(),
            None => LinkedList::new()
        }
    })
}

#[update]
pub async fn execute_intent(intent_id: u64) -> IntentStatus {
    let intent_option = INTENTS.with(|intents| {
        let intents = intents.borrow();
        intents.get(intent_id)
    });

    match intent_option {
        Some(intent) => {
            // Start execution
            let execution_result = super::execute(&intent).await;

            // Update the intent's status in storage
            update_intent_status(intent_id, execution_result.clone());

            execution_result
        },
        None => IntentStatus::Failed("Intent not found".to_string()),
    }
}


// Helper function to update intent status
fn update_intent_status(intent_id: u64, new_status: IntentStatus) {
    INTENTS.with(|intents| {
        let intents = intents.borrow_mut();
        let intent = intents.get(intent_id);    
        match intent {
            Some(mut intent) => {
                intent.status = new_status;
            }
            None => {
                panic!("Intent not found");
            }
        }
    });
}