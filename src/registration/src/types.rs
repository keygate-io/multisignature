use std::borrow::Cow;

use candid::{CandidType, Principal, Deserialize};
use ic_ledger_types::AccountIdentifier;
use ic_stable_structures::{memory_manager::VirtualMemory, storable::Bound, DefaultMemoryImpl, Storable};

#[derive(Clone, CandidType, Deserialize)]
pub struct UserAccount {
    pub canister_id: Principal,
    pub subaccounts: Vec<(String, AccountIdentifier)>,
}

impl UserAccount {
    pub fn new(canister_id: Principal) -> Self {
        UserAccount {
            canister_id: canister_id,
            subaccounts: vec![],
        }
    }
}

#[derive(Clone, CandidType, Deserialize)]
pub struct UserInfo {
    pub first_name: String,
    pub last_name: String,
    pub accounts: Vec<Principal>,
}

pub type Memory = VirtualMemory<DefaultMemoryImpl>;

const MAX_VALUE_SIZE: u32 = 500;

impl Storable for UserInfo {
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(candid::encode_one(self).unwrap()) 
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        candid::decode_one(bytes.as_ref()).unwrap()
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: MAX_VALUE_SIZE,
        is_fixed_size: false,
    };
}
