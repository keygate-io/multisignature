use std::{borrow::Cow, cmp::Ordering};

use candid::{CandidType, Deserialize};
use ic_stable_structures::{memory_manager::VirtualMemory, storable::Bound, DefaultMemoryImpl, Storable};

#[derive(Clone, CandidType, Deserialize)]
pub struct UserInfo {
    pub first_name: String,
    pub last_name: String
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



#[derive(Clone, CandidType, Deserialize, Debug)]
pub struct VaultName(pub String); 

impl Storable for VaultName {
    const BOUND: Bound = Bound::Bounded {
        /* 
         * 500 bytes is the max size for a token name.
         * Aproximately 50 characters.
         */
        max_size: 500,
        is_fixed_size: false,
    };

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(candid::encode_one(&self.0).unwrap()) 
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        candid::decode_one(bytes.as_ref()).unwrap()
    }
}

impl PartialEq for VaultName {
    fn eq(&self, other: &Self) -> bool {
        self.0.to_lowercase() == other.0.to_lowercase()
    }
}

impl Eq for VaultName { }

impl PartialOrd for VaultName {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for VaultName {
    fn cmp(&self, other: &Self) -> Ordering {
        self.0.cmp(&other.0)
    }
}
