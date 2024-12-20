use candid::CandidType;
use serde::{Deserialize, Serialize};

#[derive(Debug, CandidType, Deserialize, Serialize)]
pub struct Error {
    pub message: String,
}