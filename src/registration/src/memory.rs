use std::cell::RefCell;

use candid::Principal;
use ic_stable_structures::{memory_manager::{MemoryId, MemoryManager}, BTreeMap, DefaultMemoryImpl, StableBTreeMap};

use crate::types::{Memory, UserInfo};


const USERS_MEMORY: MemoryId = MemoryId::new(0);

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    pub static USERS: RefCell<StableBTreeMap<Principal, UserInfo, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USERS_MEMORY))
        )
    );
}