use candid::Principal;
<<<<<<< HEAD

use pocket_ic::PocketIc;

#[cfg(test)]
mod user_tests;

#[cfg(test)]
mod central_tests;

#[cfg(test)]
mod account_tests;

=======
use pocket_ic::PocketIc;



mod user_tests;

>>>>>>> main
pub mod setup;

pub mod utils;

pub mod types;

#[derive(Debug)]
pub struct CanisterIds {
    pub account: Principal,
    pub central: Principal,
    pub icp_ledger: Principal,
    pub icrc1_ledger: Principal,
}

pub struct TestEnv {
    pub env: PocketIc,
    pub canister_ids: CanisterIds,
}