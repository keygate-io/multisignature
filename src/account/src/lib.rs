mod alloy_services;
mod evm;
mod evm_types;
mod intent;
mod ledger;
mod tests;
pub mod types;

use b3_utils::{
    ledger::ICRCAccount,
    memory::types::{DefaultStableBTreeMap, DefaultStableCell, DefaultStableVec},
    Subaccount,
};
use candid::{CandidType, Principal};
use ic_cdk::{query, update};
use ic_ledger_types::AccountIdentifier;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableCell, StableLog, StableVec,
};
use intent::*;
use ledger::*;
use serde::{Deserialize, Serialize};
use std::{
    borrow::BorrowMut,
    cell::RefCell,
    collections::{HashMap, LinkedList},
};

const INTENT_LOG_INDEX_MEMORY: MemoryId = MemoryId::new(2);
const INTENT_LOG_DATA_MEMORY: MemoryId = MemoryId::new(3);
const SIGNERS_MEMORY: MemoryId = MemoryId::new(4);
const PROPOSED_TRANSACTIONS_MEMORY: MemoryId = MemoryId::new(5);
const PROPOSED_TRANSACTIONS_LAST_ID_MEMORY: MemoryId = MemoryId::new(6);
const THRESHOLD_MEMORY: MemoryId = MemoryId::new(7);
const NAME_MEMORY: MemoryId = MemoryId::new(8);
pub type VM = VirtualMemory<DefaultMemoryImpl>;

// Thread-local storage
thread_local! {
    pub static SIGNERS: RefCell<StableVec<Principal, VM>> = RefCell::new(DefaultStableVec::init(MEMORY_MANAGER.with(|m| m.borrow().get(SIGNERS_MEMORY))).expect("Failed to initialize SIGNERS StableVec"));

    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    pub static PROPOSED_TRANSACTIONS: RefCell<StableVec<ProposedTransaction, VM>> = RefCell::new(DefaultStableVec::init(MEMORY_MANAGER.with(|m| m.borrow().get(PROPOSED_TRANSACTIONS_MEMORY))).expect("Failed to initialize PROPOSED_TRANSACTIONS StableVec"));

    pub static PROPOSED_TRANSACTIONS_LAST_ID: RefCell<StableCell<u64, VM>> = RefCell::new(DefaultStableCell::init(MEMORY_MANAGER.with(|m| m.borrow().get(PROPOSED_TRANSACTIONS_LAST_ID_MEMORY)), 0).expect("Failed to initialize PROPOSED_TRANSACTIONS_LAST_ID StableCell"));

    pub static TRANSACTIONS: RefCell<StableLog<Transaction, VM, VM>> = RefCell::new(
        StableLog::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(INTENT_LOG_INDEX_MEMORY)),
            MEMORY_MANAGER.with(|m| m.borrow().get(INTENT_LOG_DATA_MEMORY)),
        ).expect("Failed to initialize INTENTS StableLog")
    );

    pub static ADAPTERS: RefCell<HashMap<String, Box<dyn BlockchainAdapter>>> = RefCell::default();
    pub static THRESHOLD: RefCell<StableCell<u64, VM>> = RefCell::new(DefaultStableCell::init(MEMORY_MANAGER.with(|m| m.borrow().get(THRESHOLD_MEMORY)), 1).expect("Failed to initialize THRESHOLD StableCell"));
    pub static NAME: RefCell<StableCell<String, VM>> = RefCell::new(DefaultStableCell::init(MEMORY_MANAGER.with(|m| m.borrow().get(NAME_MEMORY)), "".to_string()).expect("Failed to initialize NAME StableCell"));
}

// Structs and Traits
#[derive(Debug, CandidType, Deserialize, Serialize)]
struct Error {
    message: String,
}

fn signer_exists(signer: Principal) -> bool {
    SIGNERS.with(|signers: &RefCell<StableVec<Principal, VM>>| {
        signers.borrow().iter().any(|s| s == signer)
    })
}

#[update]
fn add_signer(signer: Principal) -> Result<(), Error> {
    if signer_exists(signer) {
        return Err(Error {
            message: "Signer already exists".to_string(),
        });
    }

    SIGNERS.with(|signers: &RefCell<StableVec<Principal, VM>>| {
        signers.borrow_mut().push(&signer);
    });

    Ok(())
}

#[query]
fn get_signers() -> Vec<Principal> {
    SIGNERS.with(|signers: &RefCell<StableVec<Principal, VM>>| {
        signers.borrow().iter().map(|s| s.clone()).collect()
    })
}

#[ic_cdk::query]
fn get_supported_blockchain_adapters() -> Vec<String> {
    ADAPTERS.with(|adapters| adapters.borrow().keys().cloned().collect())
}

fn get_default_icrc_subaccount() -> Subaccount {
    let owner = ic_cdk::id();
    let subaccount = Subaccount::default();

    ICRCAccount::new(owner, Some(subaccount))
        .subaccount()
        .unwrap()
}

#[ic_cdk::query]
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

#[ic_cdk::query]
fn get_icp_account() -> String {
    let subaccount = to_subaccount(0);
    let subaccountid: AccountIdentifier = to_subaccount_id(subaccount);

    subaccountid.to_hex()
}

#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
struct ProposeTransactionArgs {
    pub to: String,
    pub token: TokenPath,
    pub network: SupportedNetwork,
    pub amount: f64,
    pub transaction_type: TransactionType,
}

#[update]
fn propose_transaction(proposed_transaction: ProposeTransactionArgs) -> ProposedTransaction {
    let caller = ic_cdk::caller();
    let last_id = PROPOSED_TRANSACTIONS_LAST_ID.with(|last_id| last_id.borrow().get().clone());

    let proposed_transaction = ProposedTransaction {
        id: last_id,
        to: proposed_transaction.to,
        token: proposed_transaction.token,
        network: proposed_transaction.network,
        amount: proposed_transaction.amount,
        transaction_type: proposed_transaction.transaction_type,
        signers: vec![caller],
        rejections: vec![],
    };

    PROPOSED_TRANSACTIONS.with(|proposed_transactions| {
        proposed_transactions
            .borrow_mut()
            .push(&proposed_transaction)
            .map_err(|_| Error {
                message: "Failed to push proposed transaction to memory.".to_string(),
            })
            .unwrap();
    });

    PROPOSED_TRANSACTIONS_LAST_ID.with(|last_id| {
        let result = last_id.borrow_mut().set(proposed_transaction.id + 1);
        match result {
            Ok(_) => (),
            Err(e) => ic_cdk::trap(&format!(
                "Failed to set proposed transaction last id: {:?}",
                e
            )),
        }
    });

    proposed_transaction
}

#[query]
fn get_proposed_transaction(id: u64) -> Option<ProposedTransaction> {
    PROPOSED_TRANSACTIONS.with(|proposed_transactions| {
        proposed_transactions
            .borrow()
            .iter()
            .find(|p| p.id == id)
            .clone()
    })
}

#[query]
fn get_proposed_transactions() -> Vec<ProposedTransaction> {
    PROPOSED_TRANSACTIONS.with(|proposed_transactions| {
        proposed_transactions
            .borrow()
            .iter()
            .map(|p| p.clone())
            .collect()
    })
}

#[update]
fn set_threshold(threshold: u64) {
    THRESHOLD.with(|current_threshold| {
        current_threshold.borrow_mut().set(threshold);
    });
}

#[query]
fn get_threshold() -> u64 {
    THRESHOLD.with(|current_threshold| current_threshold.borrow().get().clone())
}

#[update]
fn approve_transaction(id: u64) -> ProposedTransaction {
    let caller = ic_cdk::caller();

    if !signer_exists(caller) {
        ic_cdk::trap(&format!("Caller is not a signer"));
    }

    PROPOSED_TRANSACTIONS.with_borrow_mut(|proposed_transactions| {
        let index_of = proposed_transactions
            .iter()
            .position(|p| p.id == id)
            .unwrap();
        let mut dxdy = proposed_transactions
            .get(index_of as u64)
            .unwrap_or_else(|| {
                ic_cdk::trap(&format!("Proposed transaction with id {} not found", id));
            });

        dxdy.signers.push(caller);

        proposed_transactions.set(index_of as u64, &dxdy);

        dxdy
    })
}

#[update]
fn reject_transaction(id: u64) -> ProposedTransaction {
    let caller = ic_cdk::caller();

    if !signer_exists(caller) {
        ic_cdk::trap(&format!("Caller is not a signer"));
    }

    PROPOSED_TRANSACTIONS.with_borrow_mut(|proposed_transactions| {
        let index_of = proposed_transactions
            .iter()
            .position(|p| p.id == id)
            .unwrap();
        let mut dxdy = proposed_transactions
            .get(index_of as u64)
            .unwrap_or_else(|| {
                ic_cdk::trap(&format!("Proposed transaction with id {} not found", id));
            });

        dxdy.rejections.push(caller);

        proposed_transactions.set(index_of as u64, &dxdy);

        dxdy
    })
}

#[ic_cdk::post_upgrade]
fn post_upgrade() {
    ADAPTERS.with(|adapters| {
        adapters.borrow_mut().insert(
            "icp:native:transfer".to_string(),
            Box::new(ICPNativeTransferAdapter::new()),
        );
        adapters.borrow_mut().insert(
            "icp:icrc1:transfer".to_string(),
            Box::new(ICRC1TransferAdapter::new()),
        )
    });
}

#[ic_cdk::init]
async fn init(keygate_core::types::canister_init::VaultInitArgs { name, signers }: keygate_core::types::canister_init::VaultInitArgs) {
    ADAPTERS.with(|adapters| {
        adapters.borrow_mut().insert(
            "icp:native:transfer".to_string(),
            Box::new(ICPNativeTransferAdapter::new()),
        );
        adapters.borrow_mut().insert(
            "icp:icrc1:transfer".to_string(),
            Box::new(ICRC1TransferAdapter::new()),
        );
        adapters.borrow_mut().insert(
            "eth:native:transfer".to_string(),
            Box::new(ETHNativeTransferAdapter::new()),
        );
    });

    SIGNERS.with(|s| {
        for signer in signers {
            s.borrow_mut().push(&signer).expect("Failed to add signer");
        }
    });
}

// Export candid
ic_cdk_macros::export_candid!();
