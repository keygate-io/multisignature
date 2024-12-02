use std::{env, path::Path, time::{Duration, SystemTime}};

use candid::Principal;
use pocket_ic::{PocketIc, PocketIcBuilder};

use crate::{utils::{controller_test_id, minter_test_id, NNS_ROOT_CANISTER_ID}, TestEnv};


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

    let mut env = PocketIcBuilder::new()
        .with_nns_subnet()
        .with_ii_subnet()
        .with_fiduciary_subnet()
        .with_application_subnet()
        .build();

    // If we set the time to SystemTime::now, and then progress pocketIC a couple ticks
    // and then enter live mode, we would crash the deterministic state machine, as the
    // live mode would set the time back to the current time.
    // Therefore, if we want to use live mode, we need to start the tests with the time
    // set to the past.
    env.set_time(SystemTime::now() - Duration::from_secs(24 * 60 * 60));
    let controller = controller_test_id();
    let minter = minter_test_id();
    let canister_ids = install_canisters(&mut env, config, controller, minter);

    TestEnv {
        env,
        canister_ids,
        controller,
        minter,
    }
}

pub fn setup_new_env() -> TestEnv {
    setup_new_env_with_config(SetupConfig::default())
}