use candid::{CandidType, Principal, Deserialize};
use ic_ledger_types::AccountIdentifier;

#[derive(Clone, CandidType, Deserialize)]
pub struct UserAccount {
    canister_id: Principal,
    subaccounts: Vec<(String, AccountIdentifier)>,
}

impl UserAccount {
    pub fn new(canister_id: Principal) -> Self {
        UserAccount {
            canister_id: canister_id,
            subaccounts: vec![],
        }
    }
}