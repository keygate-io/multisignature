use candid::CandidType;
use ic_stable_structures::{memory_manager::VirtualMemory, DefaultMemoryImpl};
use serde::{Deserialize, Serialize};

pub type Memory = VirtualMemory<DefaultMemoryImpl>;

#[derive(Debug, CandidType, Deserialize, Serialize)]
pub struct Error {
    pub message: String,
}