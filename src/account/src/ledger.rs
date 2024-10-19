use candid::Principal;
use ic_ledger_types::{AccountIdentifier as LedgerAccountIdentifier, Subaccount};

pub fn to_subaccount(nonce: u32) -> Subaccount {
    let mut subaccount = Subaccount([0; 32]);
    let nonce_bytes = nonce.to_be_bytes();
    subaccount.0[32 - nonce_bytes.len()..].copy_from_slice(&nonce_bytes);
    subaccount
}

pub fn to_subaccount_id(subaccount: Subaccount) -> LedgerAccountIdentifier {
    let principal_id = ic_cdk::id();
    LedgerAccountIdentifier::new(&principal_id, &subaccount)
}

pub fn to_subaccount_id_from_principal(principal_id: Principal, subaccount: Subaccount) -> LedgerAccountIdentifier {
    LedgerAccountIdentifier::new(&principal_id, &subaccount)
}