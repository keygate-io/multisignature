use ic_stable_structures::{
    memory_manager::VirtualMemory, DefaultMemoryImpl,
};
<<<<<<< HEAD
=======
use serde::Serialize;

#[derive(Clone, CandidType, Deserialize, Serialize, Debug, PartialEq, Eq)]
pub struct UserInfo {
    pub name: String,  // Added for completeness
}

#[derive(Clone, CandidType, Deserialize, Serialize, Debug, PartialEq, Eq)]
pub struct Vault {
    pub name: String,
    pub id: Principal,
}
>>>>>>> main

pub type Memory = VirtualMemory<DefaultMemoryImpl>;


