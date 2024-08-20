use std::cell::RefCell;

use ic_stable_structures::{memory_manager::{MemoryId, MemoryManager}, DefaultMemoryImpl, StableCell};

use crate::types::{Memory};

const LAST_SUBACCOUNT_NONCE_MEMORY: MemoryId = MemoryId::new(1);

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
    pub static LAST_SUBACCOUNT_NONCE: RefCell<StableCell<u32, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(LAST_SUBACCOUNT_NONCE_MEMORY)),
            0
        ).expect("Initializing LAST_SUBACCOUNT_NONCE StableCell failed")
    );
}