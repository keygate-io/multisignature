use b3_utils::{ledger::ICRCAccount, Subaccount};
use ic_ledger_types::AccountIdentifier;
#[cfg(test)]
use pocket_ic::PocketIc;
use std::{error::Error, fmt::format, io::Write};
use candid::{encode_one, Decode, Principal};

#[cfg(test)]
use crate::{to_subaccount};


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
    let pic = PocketIc::new();
    let caller = generate_principal();

    let account_id = pic.create_canister_with_settings(Some(caller), None);

    pic.add_cycles(account_id, 2_000_000_000_000);
    let wasm_module = include_bytes!("../../../target/wasm32-unknown-unknown/release/account.wasm").to_vec();


    pic.install_canister(account_id, wasm_module, Vec::new(), Some(caller));

    let wasm_result = pic.query_call(account_id, caller,"get_signees",  encode_one(()).unwrap());
    match wasm_result.unwrap() {
       pocket_ic::WasmResult::Reject(reject_message) => {
           panic!("Query call failed: {}", reject_message);
       },
         pocket_ic::WasmResult::Reply(reply) => {
            let signees = Decode!(&reply, Vec<Principal>);

            // caller should be included in signees vector
            match signees {
                Ok(signees) => assert_eq!(signees, vec![caller]),
                Err(e) => panic!("Error decoding signees: {}", e)
            }
         }
    }

    // check if supported blockchain adapters have icp:native:transfer
    let wasm_result = pic.query_call(account_id, caller,"get_supported_blockchain_adapters",  encode_one(()).unwrap());

    match wasm_result.unwrap() {
        pocket_ic::WasmResult::Reject(reject_message) => {
            panic!("Query call failed: {}", reject_message);
        },
        pocket_ic::WasmResult::Reply(reply) => {
            let adapters = Decode!(&reply, Vec<String>);

            match adapters {
                Ok(adapters) => assert!(adapters.contains(&"icp:native:transfer".to_string())),
                Err(e) => panic!("Error decoding adapters: {}", e)
            }
        }
    }
}

#[test]
fn should_add_signee() {
    let pic = PocketIc::new();
    let caller = generate_principal();

    let account_id = pic.create_canister_with_settings(Some(caller), None);

    pic.add_cycles(account_id, 2_000_000_000_000);
    let wasm_module = include_bytes!("../../../target/wasm32-unknown-unknown/release/account.wasm").to_vec();

    let signer = generate_principal();

    pic.install_canister(account_id, wasm_module, Vec::new(), Some(caller));

    let wasm_result = pic.update_call(account_id, caller, "include_signee", encode_one(signer).unwrap());

    match wasm_result.unwrap() {
        pocket_ic::WasmResult::Reject(reject_message) => {
            panic!("Update call failed: {}", reject_message);
        },
        pocket_ic::WasmResult::Reply(_) => {
            let wasm_result = pic.query_call(account_id, caller,"get_signees",  encode_one(()).unwrap());
            match wasm_result.unwrap() {
                pocket_ic::WasmResult::Reject(reject_message) => {
                    panic!("Query call failed: {}", reject_message);
                },
                pocket_ic::WasmResult::Reply(reply) => {
                    let signees = Decode!(&reply, Vec<Principal>);

                    // caller should be included in signees vector
                    match signees {
                        Ok(signees) => assert_eq!(signees, vec![caller, signer]),
                        Err(e) => panic!("Error decoding signees: {}", e)
                    }
                }
            }
        },
    }
}

#[test]
fn should_not_add_signee_if_exists() {
    let pic = PocketIc::new();
    let caller = generate_principal();

    let account_id = pic.create_canister_with_settings(Some(caller), None);

    pic.add_cycles(account_id, 2_000_000_000_000);

    let wasm_module = include_bytes!("../../../target/wasm32-unknown-unknown/release/account.wasm").to_vec();

    let signer = generate_principal();

    pic.install_canister(account_id, wasm_module, Vec::new(), Some(caller));

    let wasm_result = pic.update_call(account_id, caller, "include_signee", encode_one(signer).unwrap());

    match wasm_result.unwrap() {
        pocket_ic::WasmResult::Reject(reject_message) => {
            panic!("Update call failed: {}", reject_message);
        },
        pocket_ic::WasmResult::Reply(_) => {
            let wasm_result = pic.update_call(account_id, caller, "include_signee", encode_one(signer).unwrap());

            match wasm_result.unwrap() {
                pocket_ic::WasmResult::Reject(reject_message) => {
                    assert_eq!(reject_message, "Signee already exists");
                },
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
    let pic = PocketIc::new();
    let caller = generate_principal();

    let account_id = pic.create_canister_with_settings(Some(caller), None);

    let subaccountid = AccountIdentifier::new(&account_id, &to_subaccount(0)).to_hex();
    pic.add_cycles(account_id, 2_000_000_000_000);

    let wasm_module = include_bytes!("../../../target/wasm32-unknown-unknown/release/account.wasm").to_vec();

    pic.install_canister(account_id, wasm_module, Vec::new(), Some(caller));

    let wasm_result = pic.query_call(account_id, caller,"get_icp_account",  encode_one(()).unwrap());

    match wasm_result.unwrap() {
        pocket_ic::WasmResult::Reject(reject_message) => {
            panic!("Query call failed: {}", reject_message);
        },
        pocket_ic::WasmResult::Reply(reply) => {
            println!("{:?}", reply);

            let account = Decode!(&reply, String);

            match account {
                Ok(y_account) => assert_eq!(y_account, subaccountid),
                Err(e) => panic!("Error decoding account: {}", e)
            }
        }
    }
}

#[test]
fn should_get_default_account_for_icrc() {
    let pic = PocketIc::new();
    let caller = generate_principal();

    let account_id = pic.create_canister_with_settings(Some(caller), None);

    let subaccount = to_subaccount(0);

    let subaccountid = ICRCAccount::new(account_id, None).to_text();

    pic.add_cycles(account_id, 2_000_000_000_000);

    let wasm_module = include_bytes!("../../../target/wasm32-unknown-unknown/release/account.wasm").to_vec();

    pic.install_canister(account_id, wasm_module, Vec::new(), Some(caller));

    let wasm_result = pic.query_call(account_id, caller,"get_icrc_account",  encode_one(()).unwrap());

    match wasm_result.unwrap() {
        pocket_ic::WasmResult::Reject(reject_message) => {
            panic!("Query call failed: {}", reject_message);
        },
        pocket_ic::WasmResult::Reply(reply) => {
            let account = Decode!(&reply, String);

            match account {
                Ok(y_account) => assert_eq!(y_account, subaccountid),
                Err(e) => panic!("Error decoding account: {}", e)
            }
        }
    }
}

#[cfg(test)]
mod intent_tests {
    use ic_ledger_types::{AccountBalanceArgs, Tokens, DEFAULT_SUBACCOUNT};
    use icrc_ledger_types::icrc1::account::Account;
    use num_bigint::ToBigUint;
    use pocket_ic::{common::rest::base64, WasmResult};

    use crate::{ledger, types::{ArchiveOptions, FeatureFlags, ICRC1Args, ICRC1InitArgs}, Intent, IntentStatus, IntentType, SupportedNetwork};

    use super::*;

    #[test]
    fn should_add_intent_ok() {
        let receiver = generate_principal();

        let pic = PocketIc::new();
        let caller = generate_principal();

        let account_id = pic.create_canister_with_settings(Some(caller), None);

        pic.add_cycles(account_id, 2_000_000_000_000);

        let wasm_module = include_bytes!("../../../target/wasm32-unknown-unknown/release/account.wasm").to_vec();

        let receiver_account_id = ledger::to_subaccount_id_from_principal(receiver, to_subaccount(0));

        let signer = generate_principal();

        pic.install_canister(account_id, wasm_module, Vec::new(), Some(caller));

        let wasm_result = pic.update_call(account_id, caller, "include_signee", encode_one(signer).unwrap());

        match wasm_result.unwrap() {
            pocket_ic::WasmResult::Reject(reject_message) => {
                panic!("Update call failed: {}", reject_message);
            },
            pocket_ic::WasmResult::Reply(_) => {
                let sample_intent = Intent {
                    intent_type: crate::IntentType::Transfer,
                    amount: 100_000_000_000,
                    network: crate::SupportedNetwork::ICP,
                    to: receiver_account_id.to_hex(),
                    token: "icp:native".to_string(),
                    status: crate::IntentStatus::Pending("".to_string())
                };

                let wasm_result = pic.update_call(account_id, caller, "add_intent", encode_one(sample_intent.clone()).unwrap());

                match wasm_result.unwrap() {
                    pocket_ic::WasmResult::Reject(reject_message) => {
                        panic!("Update call failed: {}", reject_message);
                    },
                    pocket_ic::WasmResult::Reply(_) => {
                        let wasm_result = pic.query_call(account_id, caller,"get_intents",  encode_one(()).unwrap());

                        match wasm_result.unwrap() {
                            pocket_ic::WasmResult::Reject(reject_message) => {
                                panic!("Query call failed: {}", reject_message);
                            },
                            pocket_ic::WasmResult::Reply(reply) => {
                                let intents = Decode!(&reply, Vec<Intent>);

                                match intents {
                                    Ok(intents) => assert_eq!(intents, vec![sample_intent]),
                                    Err(e) => panic!("Error decoding intents: {}", e)
                                }
                            }
                        }
                    },
                }
            }
        }
    }

    #[test]
    fn should_transfer_icrc1() {
        let receiver = generate_principal();

        let pic = PocketIc::new();
        let caller = generate_principal();

        let account_id = pic.create_canister_with_settings(Some(caller), None);

        pic.add_cycles(account_id, 2_000_000_000_000);

        let icrc_ledger = pic.create_canister_with_settings(Some(caller), None);

        pic.add_cycles(icrc_ledger, 2_000_000_000_000);

        let icrc_wasm_module = include_bytes!("../../../mock_icrc1_wasm_build.gz").to_vec();

        let mint_amount_u64: u128 = 1000_000_000_000;

       let icrc1_deploy_args = ICRC1Args::Init(ICRC1InitArgs {
            token_symbol: "MCK".to_string(),
            token_name: "Mock Token".to_string(),
            minting_account: Account {
                owner: caller,
                subaccount: None,
            },
            transfer_fee: 1_000_000,
            metadata: vec![],
            initial_balances: vec![
                (
                    Account {
                        owner: account_id,
                        subaccount: None,
                    },
                    mint_amount_u64
                ),
            ],
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
            decimals: Some(3),  // Assuming 8 decimals, adjust as needed
            maximum_number_of_accounts: None,
            accounts_overflow_trim_quantity: None,
            fee_collector_account: None,
            max_memo_length: None,
        });

        pic.install_canister(icrc_ledger, icrc_wasm_module, encode_one(icrc1_deploy_args).unwrap(), Some(caller));

        pic.add_cycles(account_id, 2_000_000_000_000);

        let wasm_module = include_bytes!("../../../target/wasm32-unknown-unknown/release/account.wasm").to_vec();

        pic.install_canister(account_id, wasm_module, Vec::new(), Some(caller));

        println!("icrc principal id is {}", icrc_ledger.to_string());

        let wasm_result = pic.update_call(account_id, caller, "add_intent", encode_one(Intent {
            intent_type: crate::IntentType::Transfer,
            amount: 100_000_000_000,
            network: crate::SupportedNetwork::ICP,
            to: format!("{}", receiver.to_text()),
            token: "icp:icrc1:".to_string() + &icrc_ledger.to_string(),
            status: crate::IntentStatus::Pending("".to_string())
        }).unwrap());

        if wasm_result.is_err() {
            panic!("Update call failed: {:?}", wasm_result);
        }

        let wasm_result = pic.update_call(account_id, caller, "execute_intent", encode_one(0 as u64).unwrap());

        match wasm_result.unwrap() {
            pocket_ic::WasmResult::Reject(reject_message) => {
                panic!("Update call failed: {}", reject_message);
            },
            pocket_ic::WasmResult::Reply(result) => {
                let intent_status = Decode!(&result, IntentStatus).unwrap();
                assert_eq!(intent_status, IntentStatus::Completed("Successfully transferred an ICRC-1 token.".to_string()));
            }
        }

        let q_result = pic.query_call(icrc_ledger, caller, "icrc1_balance_of", encode_one(ICRCAccount::new(receiver, None)).unwrap());

        if q_result.is_err() {
            panic!("Query call failed: {:?}", q_result);
        }

        let wasm_result = q_result.unwrap();

        match wasm_result {
            pocket_ic::WasmResult::Reject(reject_message) => {
                panic!("Query call failed: {}", reject_message);
            },
            pocket_ic::WasmResult::Reply(reply) => {
                let balance = Decode!(&reply, u128);

                match balance {
                    Ok(balance) => assert_eq!(balance, 100_000_000_000),
                    Err(e) => panic!("Error decoding balance: {}", e)
                }
            }
        }
    }

    #[test]
    #[ignore]
    fn should_transfer_icp() {
        let pic = PocketIc::new();
        let caller = generate_principal();

        // Create and set up the account canister
        let account_id = pic.create_canister_with_settings(Some(caller), None);
        pic.add_cycles(account_id, 2_000_000_000_000);
        let wasm_module = include_bytes!("../../../target/wasm32-unknown-unknown/release/account.wasm").to_vec();
        pic.install_canister(account_id, wasm_module, Vec::new(), Some(caller));

        // Create a receiver principal
        let receiver = generate_principal();

        // Set up the ICP ledger canister
        let icp_ledger = Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap();
        
        // Mint some ICP to the account canister
        let mint_amount = 1_000_000_000; // 10 ICP
        let account_balance_args = AccountBalanceArgs {
            account: AccountIdentifier::new(&account_id, &DEFAULT_SUBACCOUNT)
        };
        let mint_result = pic.update_call(icp_ledger, caller, "mint", encode_one((account_balance_args.clone(), Tokens::from_e8s(mint_amount))).unwrap());
        match mint_result {
            Ok(WasmResult::Reply(_)) => {},
            Ok(WasmResult::Reject(reject_message)) => panic!("Mint call rejected: {}", reject_message),
            Err(err) => panic!("Mint call failed: {:?}", err),
        }

        // Create an intent to transfer ICP
        let transfer_amount = 100_000_000; // 1 ICP
        let intent = Intent {
            intent_type: IntentType::Transfer,
            amount: transfer_amount,
            network: SupportedNetwork::ICP,
            to: AccountIdentifier::new(&receiver, &DEFAULT_SUBACCOUNT).to_string(),
            token: "icp:native".to_string(),
            status: IntentStatus::Pending("".to_string())
        };

        // Add the intent
        let add_intent_result = pic.update_call(account_id, caller, "add_intent", encode_one(intent.clone()).unwrap());
        let intent_id = match add_intent_result {
            Ok(WasmResult::Reply(reply)) => Decode!(&reply, u64).unwrap(),
            Ok(WasmResult::Reject(reject_message)) => panic!("Add intent call rejected: {}", reject_message),
            Err(err) => panic!("Add intent call failed: {:?}", err),
        };

        // Execute the intent
        let execute_result = pic.update_call(account_id, caller, "execute_intent", encode_one(intent_id).unwrap());
        let status = match execute_result {
            Ok(WasmResult::Reply(reply)) => Decode!(&reply, IntentStatus).unwrap(),
            Ok(WasmResult::Reject(reject_message)) => panic!("Execute intent call rejected: {}", reject_message),
            Err(err) => panic!("Execute intent call failed: {:?}", err),
        };

        assert_eq!(status, IntentStatus::Completed("Successfully transferred native ICP.".to_string()));

        // Check the receiver's balance
        let receiver_balance_args = AccountBalanceArgs {
            account: AccountIdentifier::new(&receiver, &DEFAULT_SUBACCOUNT)
        };
        let receiver_balance_result = pic.query_call(icp_ledger, caller, "account_balance", encode_one(receiver_balance_args).unwrap());
        let receiver_balance = match receiver_balance_result {
            Ok(WasmResult::Reply(reply)) => Decode!(&reply, Tokens).unwrap(),
            Ok(WasmResult::Reject(reject_message)) => panic!("Receiver balance query rejected: {}", reject_message),
            Err(err) => panic!("Receiver balance query failed: {:?}", err),
        };

        assert_eq!(receiver_balance.e8s(), transfer_amount);

        // Check the account canister's balance
        let account_balance_result = pic.query_call(icp_ledger, caller, "account_balance", encode_one(account_balance_args).unwrap());
        let account_balance = match account_balance_result {
            Ok(WasmResult::Reply(reply)) => Decode!(&reply, Tokens).unwrap(),
            Ok(WasmResult::Reject(reject_message)) => panic!("Account balance query rejected: {}", reject_message),
            Err(err) => panic!("Account balance query failed: {:?}", err),
        };

    }
}