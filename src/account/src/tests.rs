use b3_utils::{ledger::ICRCAccount, Subaccount};
use ic_ledger_types::AccountIdentifier;
#[cfg(test)]
use pocket_ic::PocketIc;
use std::{error::Error, fmt::format, io::Write};
use candid::{encode_one, Decode, Principal};

#[cfg(test)]
use crate::{to_subaccount};

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
    use crate::Intent;

    use super::*;

    #[test]
    fn should_add_intent_ok() {
        let receiver = generate_principal();

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
                let sample_intent = Intent {
                    intent_type: crate::IntentType::Transfer,
                    amount: 100_000_000_000,
                    to: ""
                };

                let wasm_result = pic.update_call(account_id, caller, "add_intent", encode_one("icp:native:transfer").unwrap());

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
                                let intents = Decode!(&reply, Vec<String>);

                                match intents {
                                    Ok(intents) => assert_eq!(intents, vec!["icp:native:transfer"]),
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
    fn should_add_intent_fail() {
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
                let wasm_result = pic.update_call(account_id, caller, "add_intent", encode_one("icp:native:transfer").unwrap());

                match wasm_result.unwrap() {
                    pocket_ic::WasmResult::Reject(reject_message) => {
                        panic!("Update call failed: {}", reject_message);
                    },
                    pocket_ic::WasmResult::Reply(_) => {
                        let wasm_result = pic.update_call(account_id, caller, "add_intent", encode_one("icp:native:transfer").unwrap());

                        match wasm_result.unwrap() {
                            pocket_ic::WasmResult::Reject(reject_message) => {
                                assert_eq!(reject_message, "Intent already exists");
                            },
                            pocket_ic::WasmResult::Reply(bytes) => {
                                let reply = Decode!(&bytes, String);

                                assert!(reply.is_err())
                            }
                        }
                    },
                }
            }
        }
    }
}