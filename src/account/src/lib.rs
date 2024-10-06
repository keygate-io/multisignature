mod types;
mod ledger;
mod intent;
mod tests;

use std::{cell::RefCell, collections::{HashMap, LinkedList}, hash::DefaultHasher};
use b3_utils::{ledger::ICRCAccount, Subaccount};
use ic_cdk::{query, update};
use candid::{CandidType, Principal};
use ic_ledger_types::AccountIdentifier;
use ic_stable_structures::{memory_manager::{MemoryId, MemoryManager, VirtualMemory}, DefaultMemoryImpl, StableCell, StableLog};
use intent::*;
use serde::{Deserialize, Serialize};
use std::hash::{Hash, Hasher};
use ledger::*;

const LAST_SUBACCOUNT_NONCE_MEMORY: MemoryId = MemoryId::new(1);
const INTENT_LOG_INDEX_MEMORY: MemoryId = MemoryId::new(2);
const INTENT_LOG_DATA_MEMORY: MemoryId = MemoryId::new(3);
const LAST_ACCOUNT_MEMORY: MemoryId = MemoryId::new(4);

pub type VM = VirtualMemory<DefaultMemoryImpl>;

// Thread-local storage 
thread_local! {
    pub static SIGNEES: RefCell<Vec<Principal>> = RefCell::default();

    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    // u32 - upper limit is 4,294,967,295
    pub static LAST_SUBACCOUNT_NONCE: RefCell<StableCell<u32, VM>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(LAST_SUBACCOUNT_NONCE_MEMORY)),
            0
        ).expect("Initializing LAST_SUBACCOUNT_NONCE StableCell failed")
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

fn signee_exists(signee: Principal) -> bool {
    SIGNEES.with(|signees: &RefCell<Vec<Principal>>| {
        signees.borrow().contains(&signee)
    })
}

#[update]
fn include_signee(signee: Principal) -> Result<(), Error> {
    if signee_exists(signee) {
        return Err(Error {
            message: "Signee already exists".to_string(),
        });
    }

    SIGNEES.with(|signees: &RefCell<Vec<Principal>>| {
        signees.borrow_mut().push(signee);
    });

    Ok(())
}

#[query]
fn get_signees() -> Vec<Principal> {
    SIGNEES.with(|signees: &RefCell<Vec<Principal>>| {
        signees.borrow().clone()
    })
}

#[query]
fn get_supported_blockchain_adapters() -> Vec<String> {
    ADAPTERS.with(|adapters| {
        adapters.borrow().keys().cloned().collect()
    })
}

fn get_default_icrc_subaccount() -> Subaccount {
    let owner = ic_cdk::id();
    let subaccount = Subaccount::default();

    ICRCAccount::new(owner, Some(subaccount)).subaccount().unwrap()
}

#[query]
fn get_icrc_account() -> String {
    let owner = ic_cdk::id();
    let subaccount = Subaccount::default();
    let account = ICRCAccount::new(owner, Some(subaccount));

    account.to_text()
}

#[cfg(test)]
fn get_icp_account_id() -> AccountIdentifier {
    let subaccount = to_subaccount(0);
    to_subaccount_id(subaccount)
}

#[query]
fn get_icp_account() -> String {
    let subaccount = to_subaccount(0);
    let subaccountid: AccountIdentifier = to_subaccount_id(subaccount);

    subaccountid.to_hex()
}

#[ic_cdk::post_upgrade]
fn post_upgrade() {
    ADAPTERS.with(|adapters| {
        adapters.borrow_mut().insert("icp:native:transfer".to_string(), Box::new(ICPNativeTransferAdapter::new()));
    });
}


#[ic_cdk::init]
async fn init() {
    let caller = ic_cdk::caller();

    LAST_SUBACCOUNT_NONCE.with(|nonce_ref| {
        let _ = nonce_ref.borrow_mut().set(0);
    });

    ADAPTERS.with(|adapters| {
        adapters.borrow_mut().insert("icp:native:transfer".to_string(), Box::new(ICPNativeTransferAdapter::new()));
    });

    SIGNEES.with(|signees| {
        signees.borrow_mut().push(caller);
    });
}

// Export candid
ic_cdk_macros::export_candid!();