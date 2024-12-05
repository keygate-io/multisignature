use candid::Principal;
use pocket_ic::PocketIc;



mod user_tests;

mod setup;

mod utils;

#[derive(Debug)]
pub struct CanisterIds {
    pub account: Principal,
    pub central: Principal,
}


pub struct TestEnv {
    pub env: PocketIc,
    pub canister_ids: CanisterIds,
}