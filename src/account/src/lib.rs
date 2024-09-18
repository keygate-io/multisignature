mod types;
mod ledger;
mod hashof;
mod intent;

use std::{cell::RefCell, collections::{HashMap, LinkedList}, hash::DefaultHasher};
use ic_cdk::{query, update};
use candid::{CandidType, Principal};
use ic_ledger_types::{AccountIdentifier, Subaccount};
use ic_stable_structures::{memory_manager::{MemoryId, MemoryManager, VirtualMemory}, BTreeMap, DefaultMemoryImpl, StableCell, StableLog, Storable};
use intent::*;
use serde::{Deserialize, Serialize};
use std::hash::{Hash, Hasher};
use types::*;

use ledger::*;

const PRINCIPAL_MEMORY: MemoryId = MemoryId::new(0);
const LAST_SUBACCOUNT_NONCE_MEMORY: MemoryId = MemoryId::new(1);
const INTENT_LOG_INDEX_MEMORY: MemoryId = MemoryId::new(2);
const INTENT_LOG_DATA_MEMORY: MemoryId = MemoryId::new(3);
const LAST_ACCOUNT_MEMORY: MemoryId = MemoryId::new(4);
const TOKEN_SUBACCOUNTS_MEMORY: MemoryId = MemoryId::new(5);
const TOKEN_ACCOUNTS_MEMORY: MemoryId = MemoryId::new(6);

pub type VM = VirtualMemory<DefaultMemoryImpl>;

// Thread-local storage
thread_local! {
    pub static SIGNEES: RefCell<Vec<Principal>> = RefCell::default();

    static TOKEN_SUBACCOUNTS: RefCell<BTreeMap<String, [u8; 32], VM>> = RefCell::new(
        BTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(TOKEN_SUBACCOUNTS_MEMORY))
        )
    );

    static TOKEN_ACCOUNTS: RefCell<BTreeMap<String, [u8; 32], VM>> = RefCell::new(
        BTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(TOKEN_ACCOUNTS_MEMORY))
        )
    );
    
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    pub static PRINCIPAL: RefCell<StableCell<StoredPrincipal, VM>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(PRINCIPAL_MEMORY)),
            StoredPrincipal::default() // TODO: add to init function
        ).expect("Initializing PRINCIPAL StableCell failed")
    );

    // u32 - upper limit is 4,294,967,295
    pub static LAST_SUBACCOUNT_NONCE: RefCell<StableCell<u32, VM>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(LAST_SUBACCOUNT_NONCE_MEMORY)),
            0
        ).expect("Initializing LAST_SUBACCOUNT_NONCE StableCell failed")
    );

    pub static LAST_ACCOUNT: RefCell<StableCell<[u8; 32], VM>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(LAST_ACCOUNT_MEMORY)),
            [0; 32]
        ).expect("Initializing LAST_ACCOUNT StableCell failed")
    );

    pub static INTENTS: RefCell<StableLog<Intent, VM, VM>> = RefCell::new(
        StableLog::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(INTENT_LOG_INDEX_MEMORY)),
            MEMORY_MANAGER.with(|m| m.borrow().get(INTENT_LOG_DATA_MEMORY)),
        ).expect("Failed to initialize INTENTS StableLog")
    );
    
    pub static DECISIONS: RefCell<HashMap<u64, LinkedList<Decision>>> = RefCell::default();
    pub static ADAPTERS: RefCell<HashMap<String, Box<dyn BlockchainAdapter>>> = RefCell::default();
}

// Structs and Traits
#[derive(Debug, CandidType, Deserialize, Serialize)]
struct Error {
    message: String,
}

trait ToU64Hash {
    fn to_u64_hash(&self) -> u64;
}

// Implementations
impl ToU64Hash for [u8; 32] {
    fn to_u64_hash(&self) -> u64 {
        let mut hasher = DefaultHasher::new();
        self.hash(&mut hasher);
        hasher.finish()
    }
}

impl ToU64Hash for AccountIdentifier {
    fn to_u64_hash(&self) -> u64 {
        let bytes = from_hex(&self.to_hex()).unwrap();
        let mut hasher = DefaultHasher::new();
        bytes.hash(&mut hasher);
        hasher.finish()
    }
}

// Helper functions
fn from_hex(hex: &str) -> Result<[u8; 32], Error> {
    let vec = hex::decode(hex).map_err(|_| Error {
        message: "string to vector conversion error".to_string(),
    })?;

    let arr = vec.as_slice().try_into().map_err(|_| Error {
        message: "vector to fix array conversion error".to_string(),
    })?;

    Ok(arr)
}

fn nonce() -> u32 {
    LAST_SUBACCOUNT_NONCE.with(|nonce_ref| *nonce_ref.borrow().get())
}

#[update]
fn include_signee(signee: String) {
    SIGNEES.with(|signees: &RefCell<Vec<Principal>>| {
        match Principal::from_text(signee) {
            Ok(x) => signees.borrow_mut().push(x),
            Err(x) => ic_cdk::trap(&format!("Could not parse signee principal: {}. Is it a valid principal?", x))
        }
    });
}

#[query]
fn get_signees() -> Vec<Principal> {
    SIGNEES.with(|signees: &RefCell<Vec<Principal>>| {
        signees.borrow().clone()
    })
}

#[query]
fn get_tokens() -> Vec<String> {
    TOKEN_ACCOUNTS.with(|token_ref| token_ref.borrow().iter().map(|(key, _)| key.clone()).collect())
}

#[update]
fn add_icrc_account(token: String) -> Result<String, Error> {
    TOKEN_ACCOUNTS.with(|token_ref| {
        let mut accounts = token_ref.borrow_mut();
        if accounts.contains_key(&token) {
            return Err(Error {
                message: "Account for token already exists".to_string(),
            });
        }

        let last_account: [u8; 32] = LAST_ACCOUNT.with(|last_account_ref| last_account_ref.borrow().get().clone());
        let mut new_account = last_account.clone();

        for i in (0..32).rev() {
            if new_account[i] == 255 {
                new_account[i] = 0;
            } else {
                new_account[i] += 1;
                break;
            }
        }

        LAST_ACCOUNT.with(|last_account_ref| {
            last_account_ref.borrow_mut().set(new_account).expect("Failed to set new account");
        });

        accounts.insert(token, new_account);
        Ok(hex::encode(new_account))
    })
}

#[update]
fn add_subaccount(token: String) -> Result<String, Error> {
    let nonce = nonce();
    let subaccount = to_subaccount(nonce);
    let subaccountid: AccountIdentifier = to_subaccount_id(subaccount);
    let account_id_hash = subaccountid.to_u64_hash();

    TOKEN_SUBACCOUNTS.with(|token_ref| {
        token_ref.borrow_mut().insert(token, subaccount.0);
    });

    LAST_SUBACCOUNT_NONCE.with(|nonce_ref| {
        let _ = nonce_ref.borrow_mut().set(nonce + 1);
    });

    Ok(subaccountid.to_hex())
}

#[query]
fn get_subaccount(token: String) -> Result<String, Error> {
    TOKEN_SUBACCOUNTS.with(|token_ref| {
        match token_ref.borrow().get(&token) {
            Some(subaccount) => Ok(hex::encode(subaccount)),
            None => Err(Error {
                message: "Subaccount not found".to_string(),
            }),
        }
    })
}

#[ic_cdk::post_upgrade]
fn post_upgrade() {
    ADAPTERS.with(|adapters| {
        adapters.borrow_mut().insert("ICP-ICP-Transfer".to_string(), Box::new(ICPNativeTransferAdapter::new()));
    });
}

#[ic_cdk::init]
async fn init() {
    LAST_SUBACCOUNT_NONCE.with(|nonce_ref| {
        let _ = nonce_ref.borrow_mut().set(0);
    });

    ADAPTERS.with(|adapters| {
        adapters.borrow_mut().insert("ICP-ICP-Transfer".to_string(), Box::new(ICPNativeTransferAdapter::new()));
    });
}

// Export candid
ic_cdk_macros::export_candid!();