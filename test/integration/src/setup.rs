use std::{collections::HashSet, env, path::Path, time::{Duration, SystemTime}};

use candid::{encode_one, Principal};
use ic_ledger_types::{AccountIdentifier, Tokens, DEFAULT_SUBACCOUNT};
use icrc_ledger_types::icrc1::account::Account;
use pocket_ic::{PocketIc, PocketIcBuilder};

use crate::{types::{ArchiveOptions, FeatureFlags, ICRC1Args, ICRC1InitArgs, LedgerCanisterPayload, NnsLedgerCanisterInitPayload}, utils::{controller_test_id, generate_principal, minter_test_id, NNS_ROOT_CANISTER_ID}, CanisterIds, TestEnv};


#[derive(Clone)]
pub struct SetupConfig {
    pub upload_canister_modules: bool,
    pub fallback_controller: Option<Principal>,
    pub start_cycles: Option<u128>,
    pub default_account_owner: Option<Principal>,
    pub initial_icp_balance: Option<u64>,
    pub initial_mock_icrc1_balance: Option<u128>,
}

impl Default for SetupConfig {
    fn default() -> Self {
        Self {
            upload_canister_modules: true,
            fallback_controller: Some(NNS_ROOT_CANISTER_ID),
            start_cycles: None,
            default_account_owner: None,
            initial_icp_balance: None,
            initial_mock_icrc1_balance: None,
        }
    }
}

pub fn install_canisters(pic: &PocketIc, config: SetupConfig) -> CanisterIds {
    let central_id = pic.create_canister();
    pic.add_cycles(central_id, 2_000_000_000_000);
    let wasm_module = include_bytes!("../../../target/wasm32-unknown-unknown/release/central.wasm").to_vec();
    pic.install_canister(central_id, wasm_module, Vec::new(), None);
    
    let account_id = pic.create_canister();
    pic.add_cycles(account_id, 2_000_000_000_000);
    let account_wasm = include_bytes!("../../../target/wasm32-unknown-unknown/release/account.wasm").to_vec();

    let signers = vec![config.default_account_owner.unwrap_or(generate_principal())];

    pic.install_canister(account_id, account_wasm, candid::encode_one(keygate_core::types::canister_init::VaultInitArgs {
        name: "".to_string(),
        signers: signers.clone(),
    }).unwrap(), None);

    let specified_nns_ledger_canister_id = Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap();
    let nns_ledger_canister_id = pic
        .create_canister_with_id(None, None, specified_nns_ledger_canister_id)
        .unwrap();

    let icp_ledger_canister_wasm: Vec<u8> = include_bytes!("icp-ledger.wasm.gz").to_vec();
    let minter = generate_principal();
    let minting_account = AccountIdentifier::new(&minter, &DEFAULT_SUBACCOUNT);
    
    let initial_balance = config.initial_icp_balance.unwrap_or(100_000_000_000_000);
    let icp_ledger_init_args = LedgerCanisterPayload::Init(NnsLedgerCanisterInitPayload {
        minting_account: minting_account.to_string(),
        icrc1_minting_account: None,
        initial_values: vec![
            (
                minting_account.to_string(),
                Tokens::from_e8s(initial_balance),
            ),
            (
                AccountIdentifier::new(&signers[0], &DEFAULT_SUBACCOUNT).to_string(),
                Tokens::from_e8s(initial_balance),
            ),
            (
                AccountIdentifier::new(&account_id, &DEFAULT_SUBACCOUNT).to_string(),
                Tokens::from_e8s(initial_balance),
            ),
        ],
        max_message_size_bytes: None,
        transaction_window: None,
        archive_options: None,
        send_whitelist: HashSet::new(),
        transfer_fee: Some(Tokens::from_e8s(10_000)),
        token_symbol: Some("ICP".to_string()),
        token_name: Some("Internet Computer".to_string()),
        feature_flags: None,
        maximum_number_of_accounts: None,
        accounts_overflow_trim_quantity: None,
    });

    pic.install_canister(
        nns_ledger_canister_id,
        icp_ledger_canister_wasm,
        encode_one(icp_ledger_init_args).unwrap(),
        None,
    );

    let icrc1_ledger = pic.create_canister();
    pic.add_cycles(icrc1_ledger, 2_000_000_000_000);
    let icrc_wasm_module = include_bytes!("../../../mock_icrc1_wasm_build.gz").to_vec();

    let mint_amount = config.initial_mock_icrc1_balance.unwrap_or(1000_000_000_000u128);
    let icrc1_deploy_args = ICRC1Args::Init(ICRC1InitArgs {
        token_symbol: "MCK".to_string(),
        token_name: "Mock Token".to_string(),
        minting_account: Account {
            owner: signers[0],
            subaccount: None,
        },
        transfer_fee: 1_000_000,
        metadata: vec![],
        initial_balances: vec![(
            Account {
                owner: account_id,
                subaccount: None,
            },
            mint_amount,
        )],
        archive_options: ArchiveOptions {
            num_blocks_to_archive: 10,
            trigger_threshold: 5,
            controller_id: account_id,
            max_transactions_per_response: None,
            max_message_size_bytes: None,
            cycles_for_archive_creation: None,
            node_max_memory_size_bytes: None,
        },
        feature_flags: Some(FeatureFlags { icrc2: false }),
        decimals: Some(3),
        maximum_number_of_accounts: None,
        accounts_overflow_trim_quantity: None,
        fee_collector_account: None,
        max_memo_length: None,
    });

    pic.install_canister(
        icrc1_ledger,
        icrc_wasm_module,
        encode_one(icrc1_deploy_args).unwrap(),
        None,
    );

    CanisterIds {
        central: central_id,
        account: account_id,
        icp_ledger: nns_ledger_canister_id,
        icrc1_ledger,
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
    let canister_ids = install_canisters(&mut env, config);

    TestEnv {
        env,
        canister_ids,
    }
}

pub fn setup_new_env() -> TestEnv {
    setup_new_env_with_config(SetupConfig::default())
}