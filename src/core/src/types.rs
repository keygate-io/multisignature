
pub mod canister_init {
    use candid::{CandidType, Principal};
    use serde::{Deserialize, Serialize};

    #[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
    pub struct VaultInitArgs {
        pub name: String,
        pub signers: Vec<Principal>,
    }

}
