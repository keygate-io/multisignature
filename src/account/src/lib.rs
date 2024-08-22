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

thread_local! {
    static SIGNEES: RefCell<Vec<Principal>> = RefCell::default();
    static LIST_OF_SUBACCOUNTS: RefCell<HashMap<u64, Subaccount>> = RefCell::default();
}


#[derive(Debug, CandidType, Deserialize, Serialize)]
struct Error {
    message: String,
}

trait ToU64Hash {
    fn to_u64_hash(&self) -> u64;
}

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

fn from_hex(hex: &str) -> Result<[u8; 32], Error> {
    let vec = hex::decode(hex).map_err(|_| Error {
        message: "string to vector conversion error".to_string(),
    })?;

    let arr = vec.as_slice().try_into().map_err(|_| Error {
        message: "vector to fix array conversion error".to_string(),
    })?;

    Ok(arr)
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

#[update]
fn add_subaccount() -> Result<String, Error> {
    let nonce = nonce();
    let subaccount = to_subaccount(nonce); // needed for storing the subaccount
    let subaccountid: AccountIdentifier = to_subaccount_id(subaccount); // needed to get the hashkey & to return to user
    let account_id_hash = subaccountid.to_u64_hash();

    LIST_OF_SUBACCOUNTS.with(|list_ref| {
        list_ref.borrow_mut().insert(account_id_hash, subaccount);
    });

    LAST_SUBACCOUNT_NONCE.with(|nonce_ref| {
        let _ = nonce_ref.borrow_mut().set(nonce + 1);
    });

    Ok(subaccountid.to_hex())
}

fn to_subaccount_id(subaccount: Subaccount) -> AccountIdentifier {
    let principal_id = CanisterApiManager::id();
    AccountIdentifier::new(&principal_id, &subaccount)
}

/// Hashes a transaction by converting it into a `ledger::Transaction` and generating its hash.
///
/// This function takes a `types::Transaction` and converts its fields into the corresponding
/// `ledger::Transaction` fields. It then generates a hash of this transaction.
///
/// # Arguments
///
/// * `tx` - A reference to a `types::Transaction` to be hashed.
///
/// # Returns
///
/// * `Ok(String)` - A hexadecimal string representation of the transaction hash if successful.
/// * `Err(String)` - An error message if any part of the process fails.
///
/// # Errors
///
/// This function will return an `Err` if:
/// * The transaction's operation is not a `Transfer`.
/// * The `from`, `to`, or `spender` (if present) account identifiers are invalid.
///
/// # Panics
///
/// This function will panic if `tx.operation` is `None` or not a `Transfer` operation.
fn hash_transaction(tx: &types::Transaction) -> Result<String, String> {
    let transfer = match &tx.operation {
        Some(types::Operation::Transfer(transfer)) => transfer,
        _ => unreachable!("tx.operation should always be Operation::Transfer"),
    };
    
    let sender_slice = transfer.from.as_slice();
    let from_account = match ledger::AccountIdentifier::from_slice(sender_slice) {
        Ok(account) => account,
        Err(e) => {
            return Err(format!("Failed to create from: {:?}", e));
        }
    };

    let receiver_slice = transfer.to.as_slice();
    let to_account = match ledger::AccountIdentifier::from_slice(receiver_slice) {
        Ok(account) => account,
        Err(e) => {
            return Err(format!("Failed to create to: {:?}", e));
        }
    };

    let spender = match &transfer.spender {
        Some(spender) => {
            let spender_slice = spender.as_slice();
            match ledger::AccountIdentifier::from_slice(spender_slice) {
                Ok(account) => Some(account),
                Err(e) => {
                    return Err(format!("Failed to create spender: {:?}", e));
                }
            }
        }
        None => None,
    };

    let amount = transfer.amount.e8s;
    let fee = transfer.fee.e8s;
    let memo = tx.memo;
    let created_at_time = tx.created_at_time.timestamp_nanos;

    let tx_hash = ledger::Transaction::new(
        from_account,
        to_account,
        spender,
        Tokens::from_e8s(amount),
        Tokens::from_e8s(fee),
        Memo(memo),
        ledger::TimeStamp {
            timestamp_nanos: created_at_time,
        },
    )
    .generate_hash();

    Ok(tx_hash.to_hex())
}

ic_cdk_macros::export_candid!();

fn nonce() -> u32 {
    LAST_SUBACCOUNT_NONCE.with(|nonce_ref| *nonce_ref.borrow().get())
}

fn to_subaccount(nonce: u32) -> Subaccount {
    let mut subaccount = Subaccount([0; 32]);
    let nonce_bytes = nonce.to_be_bytes(); // Converts u32 to an array of 4 bytes
    subaccount.0[32 - nonce_bytes.len()..].copy_from_slice(&nonce_bytes); // Aligns the bytes at the end of the array
    subaccount
}

#[cfg(not(test))]
impl CanisterApiManagerTrait for CanisterApiManager {
    fn id() -> Principal {
        api::id()
    }
}
