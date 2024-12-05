use std::{env, path::Path, time::{Duration, SystemTime}};

use candid::Principal;
use pocket_ic::{PocketIc, PocketIcBuilder};

use crate::{utils::{controller_test_id, minter_test_id, NNS_ROOT_CANISTER_ID}, CanisterIds, TestEnv};


#[derive(Clone)]
pub struct SetupConfig {
    pub upload_canister_modules: bool,
    pub fallback_controller: Option<Principal>,
    pub start_cycles: Option<u128>,
}

impl Default for SetupConfig {
    fn default() -> Self {
        Self {
            upload_canister_modules: true,
            fallback_controller: Some(NNS_ROOT_CANISTER_ID),
            start_cycles: None,
        }
    }
}

pub fn install_canisters(pic: &PocketIc) -> CanisterIds {
    let central_id = pic.create_canister();
    pic.add_cycles(central_id, 2_000_000_000_000);
    let wasm_module = include_bytes!("../../../target/wasm32-unknown-unknown/release/central.wasm").to_vec();
    pic.install_canister(central_id, wasm_module, Vec::new(), None);
    
    let account_id = pic.create_canister();
    pic.add_cycles(account_id, 2_000_000_000_000);
    let account_wasm = include_bytes!("../../../target/wasm32-unknown-unknown/release/account.wasm").to_vec();
    pic.install_canister(account_id, account_wasm, Vec::new(), None);

    CanisterIds {
        central: central_id,
        account: account_id,
    }
}


pub fn setup_new_env_with_config(config: SetupConfig) -> TestEnv {
    let path = env::var_os("POCKET_IC_BIN")
        .expect("The environment variable POCKET_IC_BIN containing the absolute path to the PocketIC binary is not set")
        .clone()
        .into_string()
        .expect("Invalid string path");

    if !Path::new(&path).exists() {
        println!("
        Could not find the PocketIC binary to run canister integration tests.

        I looked for it at {:?}. You can specify another absolute path with the environment variable POCKET_IC_BIN.

        Running the testing script will automatically set the POCKET_IC_BIN environment variable:
            ./scripts/run-integration-tests.sh
        ", &path);
    }

    println!("Building PocketIC environment");
    let mut env = PocketIcBuilder::new()
        .with_ii_subnet()
        .with_nns_subnet()
        .with_application_subnet()
        .build();

    println!("Installing canisters");
    let canister_ids = install_canisters(&mut env);

    TestEnv {
        env,
        canister_ids,
    }
}

pub fn setup_new_env() -> TestEnv {
    setup_new_env_with_config(SetupConfig::default())
}