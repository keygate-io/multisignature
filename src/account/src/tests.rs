use b3_utils::{ledger::ICRCAccount, Subaccount};
use candid::{encode_one, CandidType, Decode, Principal};
use ic_ledger_types::{AccountIdentifier, Tokens};
use icrc_ledger_types::icrc1::account::Account;
use integration::setup::setup_new_env_with_config;
use integration::setup::SetupConfig;
use integration::types::NnsLedgerCanisterInitPayload;
use integration::types::NnsLedgerCanisterUpgradePayload;
use integration::TestEnv;
#[cfg(test)]
use pocket_ic::PocketIc;
#[cfg(test)]
use pocket_ic::WasmResult;
#[cfg(test)]
use pocket_ic::{query_candid_as, update_candid, update_candid_as};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::time::Duration;
use std::{error::Error, fmt::format, io::Write};

#[cfg(test)]
use crate::to_subaccount;
use crate::types::{ArchiveOptions, FeatureFlags, ICRC1Args, ICRC1InitArgs};
use crate::{
    IntentStatus, ProposeTransactionArgs, ProposedTransaction, SupportedNetwork,
    TransactionRequest, TransactionType,
};

#[allow(clippy::large_enum_variant)]
#[derive(Clone, Eq, PartialEq, Debug, CandidType, Deserialize, Serialize)]
pub enum LedgerCanisterPayload {
    Init(NnsLedgerCanisterInitPayload),
    Upgrade(Option<NnsLedgerCanisterUpgradePayload>),
}

#[cfg(test)]
pub fn get_icp_balance(env: &PocketIc, user_id: Principal) -> u64 {
    use ic_ledger_types::{AccountBalanceArgs, Tokens, DEFAULT_SUBACCOUNT};
    use pocket_ic::update_candid_as;

    let ledger_canister_id = Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap();
    let account = AccountIdentifier::new(&user_id, &DEFAULT_SUBACCOUNT);
    let account_balance_args = AccountBalanceArgs { account };
    let res: (Tokens,) = update_candid_as(
        env,
        ledger_canister_id,
        user_id,
        "account_balance",
        (account_balance_args,),
    )
    .unwrap();
    res.0.e8s()
}

#[cfg(test)]
fn generate_principal() -> Principal {
    use ed25519_dalek::SigningKey;
    use rand::rngs::OsRng;

    let mut csprng = OsRng;
    let signing_key = SigningKey::generate(&mut csprng);
    let verifying_key = signing_key.verifying_key();
    Principal::self_authenticating(&verifying_key.as_bytes())
}

#[cfg(test)]
fn gzip(blob: Vec<u8>) -> Result<Vec<u8>, Box<dyn Error>> {
    use libflate::gzip::Encoder;
    let mut encoder = Encoder::new(Vec::with_capacity(blob.len())).unwrap();
    encoder.write_all(&blob)?;
    Ok(encoder.finish().into_result().unwrap())
}

#[test]
fn should_initialize_with_default_values() {
    println!("Starting initialization test");
    
    let caller = generate_principal();

    println!("Generated caller principal: {}", caller);

    println!("Setting up test environment");
    let TestEnv {
        env,
        canister_ids,
    } = setup_new_env_with_config(SetupConfig {
        default_account_owner: Some(caller),
        ..Default::default()
    });
    
    println!("Testing get_signers endpoint");
    let wasm_result: (Vec<Principal>,) = query_candid_as(
        &env,
        canister_ids.account,
        caller,
        "get_signers",
        (),
    ).unwrap();
    
    // Verify caller is included in signers vector
    assert_eq!(wasm_result.0, vec![caller]);
    
    println!("Testing get_supported_blockchain_adapters endpoint");
    let wasm_result: (Vec<String>,) = query_candid_as(
        &env,
        canister_ids.account,
        caller,
        "get_supported_blockchain_adapters",
        (),
    ).unwrap();
    
    // Verify icp:native:transfer is supported
    assert!(wasm_result.0.contains(&"icp:native:transfer".to_string()));
    
    println!("Test completed successfully");
}


#[test]
fn should_add_signer() {
    let caller = generate_principal();
    let TestEnv {
        env,
        canister_ids,
    } = setup_new_env_with_config(SetupConfig {
        default_account_owner: Some(caller),
        ..Default::default()
    });
    
    let account_id = canister_ids.account;

    let signer = generate_principal();

    let wasm_result = env.update_call(
        account_id,
        caller,
        "add_signer",
        encode_one(signer).unwrap(),
    );

    match wasm_result.unwrap() {
        pocket_ic::WasmResult::Reject(reject_message) => {
            panic!("Update call failed: {}", reject_message);
        }
        pocket_ic::WasmResult::Reply(_) => {
            let wasm_result =
                env.query_call(account_id, caller, "get_signers", encode_one(()).unwrap());
            match wasm_result.unwrap() {
                pocket_ic::WasmResult::Reject(reject_message) => {
                    panic!("Query call failed: {}", reject_message);
                }
                pocket_ic::WasmResult::Reply(reply) => {
                    let signers = Decode!(&reply, Vec<Principal>);

                    // caller should be included in signers vector
                    match signers {
                        Ok(signers) => assert_eq!(signers, vec![caller, signer]),
                        Err(e) => panic!("Error decoding signers: {}", e),
                    }
                }
            }
        }
    }
}

#[test]
fn should_propose_transaction() {
    let pic = PocketIc::new();
    let caller = generate_principal();

    let account_id = pic.create_canister_with_settings(Some(caller), None);

    pic.add_cycles(account_id, 2_000_000_000_000);

    let wasm_module =
        include_bytes!("../../../target/wasm32-unknown-unknown/release/account.wasm").to_vec();

    pic.install_canister(account_id, wasm_module, Vec::new(), Some(caller));

    let proposed_transaction: (ProposedTransaction,) = update_candid_as(
        &pic,
        account_id,
        caller,
        "propose_transaction",
        (ProposeTransactionArgs {
            to: "test".to_string(),
            token: "test".to_string(),
            network: SupportedNetwork::ICP,
            amount: 100_000_000.0,
            transaction_type: TransactionType::Transfer,
        },),
    )
    .unwrap();

    assert_eq!(proposed_transaction.0.id, 0);
    assert_eq!(proposed_transaction.0.to, "test");
    assert_eq!(proposed_transaction.0.token, "test");
    assert_eq!(proposed_transaction.0.network, SupportedNetwork::ICP);
    assert_eq!(proposed_transaction.0.amount, 100_000_000.0);
    assert_eq!(
        proposed_transaction.0.transaction_type,
        TransactionType::Transfer
    );
    assert_eq!(proposed_transaction.0.signers, vec![caller]);
}

#[test]
fn should_get_proposed_transaction() {
    println!("Starting should_get_proposed_transaction test");
    
    println!("Generating caller principal");
    let caller = generate_principal();
    println!("Generated caller principal: {}", caller);
    
    println!("Setting up test environment");
    let TestEnv {
        env,
        canister_ids,
    } = setup_new_env_with_config(SetupConfig {
        default_account_owner: Some(caller),
        ..Default::default()
    });
    
    let account_id = canister_ids.account;
    
    println!("Proposing new transaction");
    let (proposed_transaction,): (ProposedTransaction,) = update_candid_as(
        &env,
        account_id,
        caller,
        "propose_transaction",
        (ProposeTransactionArgs {
            to: "test".to_string(),
            token: "test".to_string(),
            network: SupportedNetwork::ICP,
            amount: 100_000_000.0,
            transaction_type: TransactionType::Transfer,
        },),
    ).unwrap();

    println!("Querying proposed transaction");
    let (retrieved_transaction,): (Option<ProposedTransaction>,) = query_candid_as(
        &env,
        account_id,
        caller,
        "get_proposed_transaction",
        (proposed_transaction.id,),
    ).unwrap();

    println!("Verifying retrieved transaction matches proposed");
    match retrieved_transaction {
        Some(tx) => assert_eq!(proposed_transaction, tx),
        None => panic!("Proposed transaction not found"),
    }
    
    println!("Test completed successfully");
}

#[test]
fn should_get_proposed_transactions() {
    println!("Starting should_get_proposed_transactions test");
    
    println!("Generating caller principal");
    let caller = generate_principal();
    println!("Generated caller principal: {}", caller);
    
    println!("Setting up test environment");
    let TestEnv {
        env,
        canister_ids,
    } = setup_new_env_with_config(SetupConfig {
        default_account_owner: Some(caller),
        ..Default::default()
    });
    
    let account_id = canister_ids.account;
    
    println!("Proposing new transaction");
    let (proposed_transaction,): (ProposedTransaction,) = update_candid_as(
        &env,
        account_id,
        caller,
        "propose_transaction",
        (ProposeTransactionArgs {
            to: "test".to_string(),
            token: "test".to_string(),
            network: SupportedNetwork::ICP,
            amount: 100_000_000.0,
            transaction_type: TransactionType::Transfer,
        },),
    ).unwrap();

    println!("Querying all proposed transactions");
    let (proposed_transactions,): (Vec<ProposedTransaction>,) = query_candid_as(
        &env,
        account_id,
        caller,
        "get_proposed_transactions",
        (),
    ).unwrap();

    println!("Verifying transaction list");
    assert_eq!(proposed_transactions.len(), 1, "Expected exactly one transaction");
    assert_eq!(proposed_transactions[0], proposed_transaction, "Retrieved transaction should match proposed transaction");
    
    println!("Test completed successfully");
}

#[test]
fn should_approve_transaction() {
    println!("Starting should_approve_transaction test");
    
    println!("Generating caller principal");
    let caller = generate_principal();
    println!("Generated caller principal: {}", caller);
    
    println!("Setting up test environment");
    let TestEnv {
        env,
        canister_ids,
    } = setup_new_env_with_config(SetupConfig {
        default_account_owner: Some(caller),
        ..Default::default()
    });
    
    let account_id = canister_ids.account;
    
    println!("Proposing new transaction");
    let (proposed_transaction,): (ProposedTransaction,) = update_candid_as(
        &env,
        account_id,
        caller,
        "propose_transaction",
        (ProposeTransactionArgs {
            to: "test".to_string(),
            token: "test".to_string(),
            network: SupportedNetwork::ICP,
            amount: 100_000_000.0,
            transaction_type: TransactionType::Transfer,
        },),
    ).unwrap();

    println!("Generating additional signers");
    let signer_2 = generate_principal();
    let signer_3 = generate_principal();

    println!("Adding signers to account");
    let _: () = update_candid_as(&env, account_id, caller, "add_signer", (signer_2,)).unwrap();
    let _: () = update_candid_as(&env, account_id, caller, "add_signer", (signer_3,)).unwrap();

    println!("First signer approving transaction");
    let _: () = update_candid_as(
        &env,
        account_id,
        signer_2,
        "approve_transaction",
        (proposed_transaction.id,),
    ).unwrap();

    println!("Verifying first approval");
    let (proposed_transaction_2,): (Option<ProposedTransaction>,) = query_candid_as(
        &env,
        account_id,
        caller,
        "get_proposed_transaction",
        (proposed_transaction.id,),
    ).unwrap();

    match proposed_transaction_2 {
        Some(tx) => assert_eq!(tx.signers, vec![caller, signer_2], "Incorrect signers after first approval"),
        None => panic!("Proposed transaction not found after first approval"),
    }

    println!("Second signer approving transaction");
    let _: () = update_candid_as(
        &env,
        account_id,
        signer_3,
        "approve_transaction",
        (proposed_transaction.id,),
    ).unwrap();

    println!("Verifying second approval");
    let (proposed_transaction_3,): (Option<ProposedTransaction>,) = query_candid_as(
        &env,
        account_id,
        caller,
        "get_proposed_transaction",
        (proposed_transaction.id,),
    ).unwrap();

    match proposed_transaction_3 {
        Some(tx) => assert_eq!(tx.signers, vec![caller, signer_2, signer_3], "Incorrect signers after second approval"),
        None => panic!("Proposed transaction not found after second approval"),
    }

    println!("Test completed successfully");
}

#[test]
fn should_reject_transaction() {
    println!("Starting should_reject_transaction test");
    
    println!("Generating caller principal");
    let caller = generate_principal();
    println!("Generated caller principal: {}", caller);
    
    println!("Setting up test environment");
    let TestEnv {
        env,
        canister_ids,
    } = setup_new_env_with_config(SetupConfig {
        default_account_owner: Some(caller),
        ..Default::default()
    });
    
    let account_id = canister_ids.account;
    
    println!("Proposing new transaction");
    let (proposed_transaction,): (ProposedTransaction,) = update_candid_as(
        &env,
        account_id,
        caller,
        "propose_transaction",
        (ProposeTransactionArgs {
            to: "test".to_string(),
            token: "test".to_string(),
            network: SupportedNetwork::ICP,
            amount: 100_000_000.0,
            transaction_type: TransactionType::Transfer,
        },),
    ).unwrap();

    println!("Generating additional signers");
    let signer_2 = generate_principal();
    let signer_3 = generate_principal();

    println!("Adding signers to account");
    let _: () = update_candid_as(&env, account_id, caller, "add_signer", (signer_2,)).unwrap();
    let _: () = update_candid_as(&env, account_id, caller, "add_signer", (signer_3,)).unwrap();

    println!("First signer rejecting transaction");
    let _: () = update_candid_as(
        &env,
        account_id,
        signer_2,
        "reject_transaction",
        (proposed_transaction.id,),
    ).unwrap();

    println!("Verifying first rejection");
    let (proposed_transaction_2,): (Option<ProposedTransaction>,) = query_candid_as(
        &env,
        account_id,
        caller,
        "get_proposed_transaction",
        (proposed_transaction.id,),
    ).unwrap();

    match proposed_transaction_2 {
        Some(tx) => assert_eq!(tx.rejections, vec![signer_2], "Incorrect rejections after first rejection"),
        None => panic!("Proposed transaction not found after first rejection"),
    }

    println!("Second signer rejecting transaction");
    let _: () = update_candid_as(
        &env,
        account_id,
        signer_3,
        "reject_transaction",
        (proposed_transaction.id,),
    ).unwrap();

    println!("Verifying second rejection");
    let (proposed_transaction_3,): (Option<ProposedTransaction>,) = query_candid_as(
        &env,
        account_id,
        caller,
        "get_proposed_transaction",
        (proposed_transaction.id,),
    ).unwrap();

    match proposed_transaction_3 {
        Some(tx) => assert_eq!(tx.rejections, vec![signer_2, signer_3], "Incorrect rejections after second rejection"),
        None => panic!("Proposed transaction not found after second rejection"),
    }

    println!("Test completed successfully");
}

#[test]
fn should_set_threshold() {
    println!("Starting should_set_threshold test");
    
    println!("Generating caller principal");
    let caller = generate_principal();
    println!("Generated caller principal: {}", caller);
    
    println!("Setting up test environment");
    let TestEnv {
        env,
        canister_ids,
    } = setup_new_env_with_config(SetupConfig {
        default_account_owner: Some(caller),
        ..Default::default()
    });
    
    let account_id = canister_ids.account;
    
    println!("Setting threshold value");
    let _: () = update_candid_as(
        &env,
        account_id,
        caller,
        "set_threshold",
        (100_000_000_u64,),
    ).unwrap();

    println!("Querying threshold value");
    let (threshold,): (u64,) = query_candid_as(
        &env,
        account_id,
        caller,
        "get_threshold",
        (),
    ).unwrap();

    println!("Verifying threshold value");
    assert_eq!(threshold, 100_000_000, "Threshold value does not match expected value");
    
    println!("Test completed successfully");
}

#[test]
fn should_not_allow_tx_if_threshold_not_met() {
    println!("Starting should_not_allow_tx_if_threshold_not_met test");
    
    println!("Generating caller principal");
    let caller = generate_principal();
    println!("Generated caller principal: {}", caller);
    
    println!("Setting up test environment");
    let TestEnv {
        env,
        canister_ids,
    } = setup_new_env_with_config(SetupConfig {
        default_account_owner: Some(caller),
        ..Default::default()
    });
    
    println!("Creating and setting up ICRC ledger");
    let icrc_ledger = env.create_canister_with_settings(Some(caller), None);
    env.add_cycles(icrc_ledger, 2_000_000_000_000);
    
    let icrc_wasm_module = include_bytes!("../../../mock_icrc1_wasm_build.gz").to_vec();
    
    println!("Initializing ICRC ledger with tokens");
    let mint_amount_u64: u128 = 1000_000_000_000;
    let icrc1_deploy_args = ICRC1Args::Init(ICRC1InitArgs {
        token_symbol: "MCK".to_string(),
        token_name: "Mock Token".to_string(),
        minting_account: Account { owner: caller, subaccount: None },
        transfer_fee: 1_000_000,
        metadata: vec![],
        initial_balances: vec![(
            Account { owner: canister_ids.account, subaccount: None },
            mint_amount_u64,
        )],
        archive_options: ArchiveOptions {
            num_blocks_to_archive: 10,
            trigger_threshold: 5,
            controller_id: canister_ids.account,
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
    
    println!("Installing ICRC ledger");
    env.install_canister(
        icrc_ledger,
        icrc_wasm_module,
        encode_one(icrc1_deploy_args).unwrap(),
        Some(caller),
    );
    
    println!("Adding additional signers");
    let signer_2 = generate_principal();
    let signer_3 = generate_principal();
    let _: () = update_candid_as(&env, canister_ids.account, caller, "add_signer", (signer_2,)).unwrap();
    let _: () = update_candid_as(&env, canister_ids.account, caller, "add_signer", (signer_3,)).unwrap();
    
    println!("Setting threshold to require 2 signers");
    let _: () = update_candid_as(&env, canister_ids.account, caller, "set_threshold", (2u64,)).unwrap();
    
    println!("Generating receiver principal");
    let receiver = generate_principal();
    
    println!("Proposing transaction");
    let (proposed_transaction,): (ProposedTransaction,) = update_candid_as(
        &env,
        canister_ids.account,
        caller,
        "propose_transaction",
        (ProposeTransactionArgs {
            to: receiver.to_text(),
            token: format!("icp:icrc1:{}", icrc_ledger.to_text()),
            network: SupportedNetwork::ICP,
            amount: 100_000_000_000.0,
            transaction_type: TransactionType::Transfer,
        },),
    ).unwrap();
    
    println!("Attempting execution with insufficient signers");
    let execute_result: (Result<IntentStatus, String>,) = update_candid_as(
        &env,
        canister_ids.account,
        caller,
        "execute_transaction",
        (proposed_transaction.id,),
    ).unwrap();
    
    assert!(
        matches!(execute_result.0, Ok(IntentStatus::Failed(msg)) if msg.contains("Threshold not met")),
        "Expected failure due to threshold not met"
    );
    
    println!("Verifying receiver balance is still 0");
    let (balance,): (u128,) = query_candid_as(
        &env,
        icrc_ledger,
        caller,
        "icrc1_balance_of",
        (ICRCAccount::new(receiver, None),),
    ).unwrap();
    
    assert_eq!(balance, 0, "Receiver balance should be 0 as transfer should have failed");
    
    println!("Having second signer approve transaction");
    let _: () = update_candid_as(
        &env,
        canister_ids.account,
        signer_2,
        "approve_transaction",
        (proposed_transaction.id,),
    ).unwrap();
    
    println!("Executing transaction with sufficient signers");
    let execute_result: (Result<IntentStatus, String>,) = update_candid_as(
        &env,
        canister_ids.account,
        caller,
        "execute_transaction",
        (proposed_transaction.id,),
    ).unwrap();
    
    assert!(
        matches!(execute_result.0, Ok(IntentStatus::Completed(_))),
        "Expected successful completion after meeting threshold"
    );
    
    println!("Verifying final receiver balance");
    let (balance,): (u128,) = query_candid_as(
        &env,
        icrc_ledger,
        caller,
        "icrc1_balance_of",
        (ICRCAccount::new(receiver, None),),
    ).unwrap();
    
    assert_eq!(balance, 100_000_000_000, "Receiver should have received the transfer amount");
    
    println!("Test completed successfully");
}

#[test]
fn should_not_add_signer_if_exists() {
    let pic = PocketIc::new();
    let caller = generate_principal();

    let account_id = pic.create_canister_with_settings(Some(caller), None);

    pic.add_cycles(account_id, 2_000_000_000_000);

    let wasm_module =
        include_bytes!("../../../target/wasm32-unknown-unknown/release/account.wasm").to_vec();

    let signer = generate_principal();

    pic.install_canister(account_id, wasm_module, Vec::new(), Some(caller));

    let wasm_result = pic.update_call(
        account_id,
        caller,
        "add_signer",
        encode_one(signer).unwrap(),
    );

    match wasm_result.unwrap() {
        pocket_ic::WasmResult::Reject(reject_message) => {
            panic!("Update call failed: {}", reject_message);
        }
        pocket_ic::WasmResult::Reply(_) => {
            let wasm_result = pic.update_call(
                account_id,
                caller,
                "add_signer",
                encode_one(signer).unwrap(),
            );

            match wasm_result.unwrap() {
                pocket_ic::WasmResult::Reject(reject_message) => {
                    assert_eq!(reject_message, "signer already exists");
                }
                pocket_ic::WasmResult::Reply(bytes) => {
                    let reply = Decode!(&bytes, String);

                    assert!(reply.is_err())
                }
            }
        }
    }
}

#[test]
fn should_get_default_account_for_icp() {
    println!("Starting should_get_default_account_for_icp test");
    
    println!("Generating caller principal");
    let caller = generate_principal();
    println!("Generated caller principal: {}", caller);
    
    println!("Setting up test environment");
    let TestEnv {
        env,
        canister_ids,
    } = setup_new_env_with_config(SetupConfig {
        default_account_owner: Some(caller),
        ..Default::default()
    });
    
    let account_id = canister_ids.account;
    
    println!("Calculating expected subaccount ID");
    let expected_account_id = AccountIdentifier::new(&account_id, &to_subaccount(0)).to_hex();
    
    println!("Querying ICP account");
    let (actual_account,): (String,) = query_candid_as(
        &env,
        account_id,
        caller,
        "get_icp_account",
        (),
    ).unwrap();

    println!("Verifying account ID matches");
    assert_eq!(actual_account, expected_account_id);
    
    println!("Test completed successfully");
}

#[test]
fn should_get_default_account_for_icrc() {
    println!("Starting should_get_default_account_for_icrc test");
    
    println!("Generating caller principal");
    let caller = generate_principal();
    println!("Generated caller principal: {}", caller);
    
    println!("Setting up test environment");
    let TestEnv {
        env,
        canister_ids,
    } = setup_new_env_with_config(SetupConfig {
        default_account_owner: Some(caller),
        ..Default::default()
    });
    
    let account_id = canister_ids.account;
    
    println!("Calculating expected ICRC account ID");
    let expected_account_id = ICRCAccount::new(account_id, None).to_text();
    
    println!("Querying ICRC account");
    let (actual_account,): (String,) = query_candid_as(
        &env,
        account_id,
        caller,
        "get_icrc_account",
        (),
    ).unwrap();

    println!("Verifying account ID matches");
    assert_eq!(actual_account, expected_account_id);
    
    println!("Test completed successfully");
}

#[cfg(test)]
mod intent_tests {
    use std::collections::{HashMap, HashSet};

    use ic_ledger_types::{AccountBalanceArgs, Tokens, DEFAULT_SUBACCOUNT};
    use icrc_ledger_types::icrc1::account::Account;
    use num_bigint::ToBigUint;
    use pocket_ic::{common::rest::base64, query_candid, PocketIcBuilder, WasmResult};

    use crate::{
        ledger,
        types::{ArchiveOptions, FeatureFlags, ICRC1Args, ICRC1InitArgs},
        Intent, IntentStatus, SupportedNetwork, TransactionRequest, TransactionType,
        RECOMMENDED_ICP_TRANSACTION_FEE,
    };

    use super::*;

    #[test]
    fn should_transfer_icrc1() {
        let mut test_env = setup_new_env_with_config(SetupConfig {
            default_account_owner: Some(generate_principal()),
            initial_mock_icrc1_balance: Some(1000_000_000_000),
            ..Default::default()
        });
        
        let caller = test_env.canister_ids.account;
        let receiver = generate_principal();
        
        let transfer_amount = 100_000_000_000.0;
        let proposed_tx = ProposeTransactionArgs {
            transaction_type: TransactionType::Transfer,
            amount: transfer_amount,
            network: SupportedNetwork::ICP,
            to: receiver.to_text(),
            token: format!("icp:icrc1:{}", test_env.canister_ids.icrc1_ledger.to_text()),
        };

        let add_intent_result: (ProposedTransaction,) = update_candid_as(
            &test_env.env,
            test_env.canister_ids.account,
            caller,
            "propose_transaction",
            (proposed_tx,),
        )
        .unwrap();

        let status: (IntentStatus,) = update_candid_as(
            &test_env.env,
            test_env.canister_ids.account,
            caller,
            "execute_transaction",
            (add_intent_result.0.id,),
        )
        .unwrap();

        assert_eq!(
            status.0,
            IntentStatus::Completed("Successfully transferred an ICRC-1 token.".to_string())
        );

        let receiver_balance: (u128,) = query_candid_as(
            &test_env.env,
            test_env.canister_ids.icrc1_ledger,
            caller,
            "icrc1_balance_of",
            (ICRCAccount::new(receiver, None),),
        )
        .unwrap();

        assert_eq!(receiver_balance.0, transfer_amount as u128);

        let account_balance: (u128,) = query_candid_as(
            &test_env.env,
            test_env.canister_ids.icrc1_ledger,
            caller,
            "icrc1_balance_of",
            (ICRCAccount::new(test_env.canister_ids.account, None),),
        )
        .unwrap();

        assert_eq!(
            account_balance.0,
            1000_000_000_000 - transfer_amount as u128 - 1_000_000
        );
    }

    #[test]
    fn should_transfer_icp() {
        let mut test_env = setup_new_env_with_config(SetupConfig {
            default_account_owner: Some(generate_principal()),
            initial_icp_balance: Some(100_000_000_000_000),
            ..Default::default()
        });
        
        let caller = test_env.canister_ids.account;
        let receiver = generate_principal();
        
        // Create an intent to transfer ICP
        let transfer_amount = 100_000_000.0; // 1 ICP
        let receiver_account = AccountIdentifier::new(&receiver, &DEFAULT_SUBACCOUNT);
        let proposed_tx = ProposeTransactionArgs {
            transaction_type: TransactionType::Transfer,
            amount: transfer_amount,
            network: SupportedNetwork::ICP,
            to: format!("{}", receiver_account.to_string()),
            token: "icp:native".to_string(),
        };

        // Add the intent
        let add_intent_result: (ProposedTransaction,) = update_candid_as(
            &test_env.env,
            test_env.canister_ids.account,
            caller,
            "propose_transaction",
            (proposed_tx,),
        )
        .unwrap();

        // Execute the intent
        let execute_result = test_env.env.update_call(
            test_env.canister_ids.account,
            caller,
            "execute_transaction",
            encode_one(add_intent_result.0.id).unwrap(),
        );
        let status = match execute_result {
            Ok(WasmResult::Reply(reply)) => Decode!(&reply, IntentStatus).unwrap(),
            Ok(WasmResult::Reject(reject_message)) => {
                panic!("Execute intent call rejected: {}", reject_message)
            }
            Err(err) => panic!("Execute intent call failed: {:?}", err),
        };

        assert_eq!(
            status,
            IntentStatus::Completed("Successfully transferred native ICP.".to_string())
        );

        // Check the receiver's balance
        let receiver_balance_args = AccountBalanceArgs {
            account: AccountIdentifier::new(&receiver, &DEFAULT_SUBACCOUNT),
        };
        let receiver_balance_result: (Tokens,) = query_candid_as(
            &test_env.env,
            test_env.canister_ids.icp_ledger,
            caller,
            "account_balance",
            (receiver_balance_args,),
        )
        .unwrap();
        let receiver_balance = receiver_balance_result.0;

        assert_eq!(receiver_balance.e8s(), transfer_amount as u64);

        // Check the account canister's balance
        let account_balance_args = AccountBalanceArgs {
            account: AccountIdentifier::new(&test_env.canister_ids.account, &DEFAULT_SUBACCOUNT),
        };
        let account_balance_result: (Tokens,) = query_candid_as(
            &test_env.env,
            test_env.canister_ids.icp_ledger,
            caller,
            "account_balance",
            (account_balance_args,),
        )
        .unwrap();
        let account_balance = account_balance_result.0;

        assert_eq!(
            account_balance.e8s(),
            100_000_000_000_000 - transfer_amount as u64 - RECOMMENDED_ICP_TRANSACTION_FEE
        );
    }
}
