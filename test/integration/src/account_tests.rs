use b3_utils::ledger::ICRCAccount;
use candid::{encode_one, CandidType, Decode, Principal};
use ic_ledger_types::AccountIdentifier;
use crate::setup::setup_new_env_with_config;
use crate::setup::SetupConfig;
use crate::types::NnsLedgerCanisterInitPayload;
use crate::types::NnsLedgerCanisterUpgradePayload;
use crate::TestEnv;
use pocket_ic::{query_candid_as, update_candid_as};
use serde::{Deserialize, Serialize};

// use core
use keygate_core::utils::to_subaccount;
// use core
use keygate_core::types::vault::{IntentStatus, ProposeTransactionArgs, ProposedTransaction, SupportedNetwork, TransactionType};

#[allow(clippy::large_enum_variant)]
#[derive(Clone, Eq, PartialEq, Debug, CandidType, Deserialize, Serialize)]
pub enum LedgerCanisterPayload {
    Init(NnsLedgerCanisterInitPayload),
    Upgrade(Option<NnsLedgerCanisterUpgradePayload>),
}

fn generate_principal() -> Principal {
    use ed25519_dalek::SigningKey;
    use rand::rngs::OsRng;

    let mut csprng = OsRng;
    let signing_key = SigningKey::generate(&mut csprng);
    let verifying_key = signing_key.verifying_key();
    Principal::self_authenticating(&verifying_key.as_bytes())
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
    let caller = generate_principal();
    let TestEnv {
        env,
        canister_ids,
    } = setup_new_env_with_config(SetupConfig {
        default_account_owner: Some(caller),
        ..Default::default()
    });
    
    let account_id = canister_ids.account;

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
    )
    .unwrap();

    assert_eq!(proposed_transaction.id, 0);
    assert_eq!(proposed_transaction.to, "test");
    assert_eq!(proposed_transaction.token, "test");
    assert_eq!(proposed_transaction.network, SupportedNetwork::ICP);
    assert_eq!(proposed_transaction.amount, 100_000_000.0);
    assert_eq!(proposed_transaction.transaction_type, TransactionType::Transfer);
    assert_eq!(proposed_transaction.signers, vec![caller]);
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
    let caller = generate_principal();
    let TestEnv {
        env,
        canister_ids,
    } = setup_new_env_with_config(SetupConfig {
        default_account_owner: Some(caller),
        initial_mock_icrc1_balance: None,
        ..Default::default()
    });

    let signer_2 = generate_principal();
    let signer_3 = generate_principal();
    let _: () = update_candid_as(&env, canister_ids.account, caller, "add_signer", (signer_2,)).unwrap();
    let _: () = update_candid_as(&env, canister_ids.account, caller, "add_signer", (signer_3,)).unwrap();
    
    let _: () = update_candid_as(&env, canister_ids.account, caller, "set_threshold", (2u64,)).unwrap();
    
    let receiver = generate_principal();
    let (proposed_transaction,): (ProposedTransaction,) = update_candid_as(
        &env,
        canister_ids.account,
        caller,
        "propose_transaction",
        (ProposeTransactionArgs {
            to: receiver.to_text(),
            token: format!("icp:icrc1:{}", canister_ids.icrc1_ledger.to_text()),
            network: SupportedNetwork::ICP,
            amount: 100_000_000_000.0,
            transaction_type: TransactionType::Transfer,
        },),
    ).unwrap();
    
    let execute_result: (IntentStatus, ) = update_candid_as(
        &env,
        canister_ids.account,
        caller,
        "execute_transaction",
        (proposed_transaction.id,),
    ).unwrap();
    
    assert!(
        matches!(execute_result.0, IntentStatus::Failed(msg) if msg.contains("Threshold not met")),
        "Expected failure due to threshold not met"
    );
    
    let (balance,): (u128,) = query_candid_as(
        &env,
        canister_ids.icrc1_ledger,
        caller,
        "icrc1_balance_of",
        (ICRCAccount::new(receiver, None),),
    ).unwrap();
    
    assert_eq!(balance, 0, "Receiver balance should be 0 as transfer should have failed");
    
    let _: () = update_candid_as(
        &env,
        canister_ids.account,
        signer_2,
        "approve_transaction",
        (proposed_transaction.id,),
    ).unwrap();
    
    let execute_result: (IntentStatus, ) = update_candid_as(
        &env,
        canister_ids.account,
        caller,
        "execute_transaction",
        (proposed_transaction.id,),
    ).unwrap();
    
    assert!(
        matches!(execute_result.0, IntentStatus::Completed(_)),
        "Expected successful completion after meeting threshold"
    );
    
    let (balance,): (u128,) = query_candid_as(
        &env,
        canister_ids.icrc1_ledger,
        caller,
        "icrc1_balance_of",
        (ICRCAccount::new(receiver, None),),
    ).unwrap();
    
    assert_eq!(balance, 100_000_000_000, "Receiver should have received the transfer amount");
}

#[test]
fn should_not_add_signer_if_exists() {
    println!("Starting should_not_add_signer_if_exists test");
    
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
    
    println!("Generating signer principal");
    let signer = generate_principal();
    
    println!("Adding signer for the first time");
    let _: () = update_candid_as(
        &env,
        account_id,
        caller,
        "add_signer",
        (signer,),
    ).unwrap();
    
    println!("Attempting to add same signer again");
    let (result,): (Result<(), keygate_core::error::Error>,) = update_candid_as(
        &env,
        account_id,
        caller,
        "add_signer",
        (signer,),
    ).unwrap();
    
    assert!(
        result.is_err(),
        "Expected error when adding duplicate signer"
    );
    assert_eq!(
        result.unwrap_err().message,
        "Signer already exists",
        "Expected rejection message 'Signer already exists'"
    );
    
    println!("Verifying final signers list");
    let (signers,): (Vec<Principal>,) = query_candid_as(
        &env,
        account_id,
        caller,
        "get_signers",
        (),
    ).unwrap();
    
    assert_eq!(
        signers,
        vec![caller, signer],
        "Signers list should contain exactly caller and signer"
    );
    
    println!("Test completed successfully");
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

mod intent_tests {
    

    use ic_ledger_types::{AccountBalanceArgs, Tokens, DEFAULT_SUBACCOUNT};
    
    
    use pocket_ic::WasmResult;


    // use/move to core
    use keygate_core::types::vault::{
        ledger::RECOMMENDED_ICP_TRANSACTION_FEE, IntentStatus, SupportedNetwork, TransactionType,
    };

    use super::*;

    #[test]
    fn should_transfer_icrc1() {
        let test_env = setup_new_env_with_config(SetupConfig {
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
        let test_env = setup_new_env_with_config(SetupConfig {
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
