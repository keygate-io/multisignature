use std::{borrow::Cow, cmp::Ordering};

use candid::{CandidType, Deserialize, Principal};
use ic_stable_structures::{memory_manager::VirtualMemory, storable::Bound, DefaultMemoryImpl, Storable};
use serde::Serialize;

#[derive(Clone, CandidType, Deserialize, Serialize, Debug)]
pub struct UserInfo {
    pub vaults: Vec<Principal>
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

