// Imports
mod memory;
mod types;
mod tests;
mod ledger;
mod hashof;

use std::{cell::RefCell, collections::HashMap, hash::DefaultHasher};
use ic_cdk::{api, query, update};
use candid::{CandidType, Principal};
use ic_ledger_types::{AccountIdentifier, Memo, Subaccount, Tokens};
use serde::{Deserialize, Serialize};
use ic_cdk_macros::*;
use ic_cdk_timers::TimerId;
use std::hash::{Hash, Hasher};

use types::{
    CallerGuard, CanisterApiManagerTrait,
    InterCanisterCallManager, Network,
    Operation, QueryBlocksRequest, QueryBlocksResponse, StoredPrincipal, StoredTransactions,
    SweepStatus, TimerManager, TimerManagerTrait, Timestamp, Transaction,
    CanisterApiManager
};

use memory::{
    CONNECTED_NETWORK, CUSTODIAN_PRINCIPAL, INTERVAL_IN_SECONDS, LAST_SUBACCOUNT_NONCE, NEXT_BLOCK,
    PRINCIPAL, TRANSACTIONS, WEBHOOK_URL,
};

use ledger::*;

// Thread-local storage
thread_local! {
    static SIGNEES: RefCell<Vec<Principal>> = RefCell::default();
    static LIST_OF_SUBACCOUNTS: RefCell<HashMap<u64, Subaccount>> = RefCell::default();
    static TOKEN_SUBACCOUNTS: RefCell<HashMap<String, Subaccount>> = RefCell::default();
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

#[cfg(not(test))]
impl CanisterApiManagerTrait for CanisterApiManager {
    fn id() -> Principal {
        api::id()
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

fn to_subaccount(nonce: u32) -> Subaccount {
    let mut subaccount = Subaccount([0; 32]);
    let nonce_bytes = nonce.to_be_bytes();
    subaccount.0[32 - nonce_bytes.len()..].copy_from_slice(&nonce_bytes);
    subaccount
}

fn to_subaccount_id(subaccount: Subaccount) -> AccountIdentifier {
    let principal_id = CanisterApiManager::id();
    AccountIdentifier::new(&principal_id, &subaccount)
}

fn hash_transaction(tx: &types::Transaction) -> Result<String, String> {
    let transfer = match &tx.operation {
        Some(types::Operation::Transfer(transfer)) => transfer,
        _ => unreachable!("tx.operation should always be Operation::Transfer"),
    };
    
    let from_account = ledger::AccountIdentifier::from_slice(transfer.from.as_slice())
        .map_err(|e| format!("Failed to create from: {:?}", e))?;

    let to_account = ledger::AccountIdentifier::from_slice(transfer.to.as_slice())
        .map_err(|e| format!("Failed to create to: {:?}", e))?;

    let spender = transfer.spender.as_ref().map(|spender| {
        ledger::AccountIdentifier::from_slice(spender.as_slice())
            .map_err(|e| format!("Failed to create spender: {:?}", e))
    }).transpose()?;

    let tx_hash = ledger::Transaction::new(
        from_account,
        to_account,
        spender,
        Tokens::from_e8s(transfer.amount.e8s),
        Tokens::from_e8s(transfer.fee.e8s),
        Memo(tx.memo),
        ledger::TimeStamp {
            timestamp_nanos: tx.created_at_time.timestamp_nanos,
        },
    )
    .generate_hash();

    Ok(tx_hash.to_hex())
}

// Public functions (query and update)
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

#[update]
fn add_subaccount(token: String) -> Result<String, Error> {
    let nonce = nonce();
    let subaccount = to_subaccount(nonce);
    let subaccountid: AccountIdentifier = to_subaccount_id(subaccount);
    let account_id_hash = subaccountid.to_u64_hash();

    LIST_OF_SUBACCOUNTS.with(|list_ref| {
        list_ref.borrow_mut().insert(account_id_hash, subaccount);
    });

    LAST_SUBACCOUNT_NONCE.with(|nonce_ref| {
        let _ = nonce_ref.borrow_mut().set(nonce + 1);
    });

    TOKEN_SUBACCOUNTS.with(|token_ref| {
        token_ref.borrow_mut().insert(token, subaccount);
    });

    Ok(subaccountid.to_hex())
}

#[query]
fn get_subaccount(token: String) -> Result<String, Error> {
    TOKEN_SUBACCOUNTS.with(|token_ref| {
        match token_ref.borrow().get(&token) {
            Some(subaccount) => Ok(to_subaccount_id(*subaccount).to_hex()),
            None => Err(Error {
                message: "Subaccount not found".to_string(),
            }),
        }
    })
}

#[ic_cdk::init]
async fn init() {
    LAST_SUBACCOUNT_NONCE.with(|nonce_ref| {
        let _ = nonce_ref.borrow_mut().set(0);
    });
}

// Export candid
ic_cdk_macros::export_candid!();