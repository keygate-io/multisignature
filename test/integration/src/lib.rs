use candid::Principal;
use pocket_ic::PocketIc;



mod user_tests;

mod setup;

mod utils;

#[derive(Debug)]
pub struct CanisterIds {
    pub icp_ledger: Principal,
    pub icp_index: Principal,
    pub cycles_minting_canister: Principal,
    pub control_panel: Principal,
    pub station: Principal,
}


pub struct TestEnv {
    pub env: PocketIc,
    pub canister_ids: CanisterIds,
    pub controller: Principal,
    pub minter: Principal,
}