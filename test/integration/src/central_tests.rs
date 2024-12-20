use std::{error::Error, io::Write};

use candid::{encode_one, Decode, Principal};
use ed25519_dalek::SigningKey;
use pocket_ic::{PocketIc, WasmResult};
use rand::rngs::OsRng;

use keygate_core::types::central::{UserData, Vault, VaultInitArgs};

fn generate_principal() -> Principal {
    let mut csprng = OsRng;
    let signing_key = SigningKey::generate(&mut csprng);
    let verifying_key = signing_key.verifying_key();
    Principal::self_authenticating(&verifying_key.as_bytes())
}

fn gzip(blob: Vec<u8>) -> Result<Vec<u8>, Box<dyn Error>> {
    use libflate::gzip::Encoder;
    let mut encoder = Encoder::new(Vec::with_capacity(blob.len())).unwrap();
    encoder.write_all(&blob)?;
    Ok(encoder.finish().into_result().unwrap())
}

#[test]
fn should_initialize_wasm_on_startup() {
    let pic = PocketIc::new();
    let central_id = pic.create_canister();
    pic.add_cycles(central_id, 2_000_000_000_000);
    let wasm_module =
        include_bytes!("../../../target/wasm32-unknown-unknown/release/central.wasm").to_vec();
    pic.install_canister(central_id, wasm_module, Vec::new(), None);

    let wasm_result = pic.query_call(
        central_id,
        Principal::anonymous(),
        "get_wasm",
        encode_one(()).unwrap(),
    );
    assert!(
        wasm_result.is_ok(),
        "Failed to execute query 'get_wasm': {}",
        wasm_result.unwrap_err()
    );

    match wasm_result.unwrap() {
        pocket_ic::WasmResult::Reply(bytes) => {
            let wasm_vec_bytes = Decode!(&bytes, Vec<u8>);
            assert!(
                wasm_vec_bytes.is_ok(),
                "Failed to decode WASM bytes: {:?}",
                wasm_vec_bytes.unwrap_err()
            );

            let decoded_wasm = wasm_vec_bytes.unwrap();

            assert!(
                !decoded_wasm.is_empty(),
                "Decoded WASM is empty. Expected non-empty WASM module."
            );
        }
        pocket_ic::WasmResult::Reject(msg) => {
            panic!("Canister rejected 'get_wasm' call: {}", msg);
        }
    }
}

#[test]
fn register_user_ok() {
    let pic = PocketIc::new();
    let central_id = pic.create_canister();
    pic.add_cycles(central_id, 2_000_000_000_000);
    let wasm_module =
        include_bytes!("../../../target/wasm32-unknown-unknown/release/central.wasm").to_vec();
    pic.install_canister(central_id, wasm_module, Vec::new(), None);

    let caller = generate_principal();

    let wasm_result = pic.update_call(central_id, caller, "register_user", encode_one(()).unwrap());

    assert!(
        wasm_result.is_ok(),
        "Failed to execute update 'register_user': {}",
        wasm_result.unwrap_err()
    );

    let query_result = pic.query_call(central_id, caller, "get_user", encode_one(()).unwrap());

    match query_result.unwrap() {
        pocket_ic::WasmResult::Reply(bytes) => {
            let user_info = Decode!(&bytes, Option<UserData>);
            assert!(
                user_info.is_ok(),
                "Failed to decode UserInfo: {:?}",
                user_info.unwrap_err()
            );
            assert!(
                user_info.unwrap().is_some(),
                "Expected Some(UserInfo) but got None"
            );
        }
        pocket_ic::WasmResult::Reject(msg) => {
            panic!("Canister rejected 'get_user' call: {}", msg);
        }
    };
}

#[test]
fn get_user_should_return_none_if_not_exists() {
    let pic = PocketIc::new();
    let central_id = pic.create_canister();
    pic.add_cycles(central_id, 2_000_000_000_000);
    let wasm_module =
        include_bytes!("../../../target/wasm32-unknown-unknown/release/central.wasm").to_vec();
    pic.install_canister(central_id, wasm_module, Vec::new(), None);

    let caller = generate_principal();

    let query_result = pic.query_call(
        central_id,
        Principal::anonymous(),
        "get_user",
        encode_one(caller).unwrap(),
    );

    match query_result {
        Ok(pocket_ic::WasmResult::Reply(bytes)) => {
            let user_info = Decode!(&bytes, Option<UserData>);
            assert!(
                user_info.is_ok(),
                "Failed to decode UserInfo: {:?}",
                user_info.unwrap_err()
            );
            assert!(
                user_info.unwrap().is_none(),
                "Expected None but got Some(UserInfo)"
            );
        }
        Ok(pocket_ic::WasmResult::Reject(msg)) => {
            panic!("Canister rejected 'get_user' call: {}", msg);
        }
        Err(e) => {
            assert!(
                e.code == pocket_ic::ErrorCode::CanisterCalledTrap,
                "Expected CanisterCalledTrap but got {:?}",
                e.code
            );
            assert!(e.description.contains("User with principal") && e.description.contains("not found"), "Expected error message to contain 'User with principal' and 'not found' but got: {}", e.description);
        }
    }
}

#[test]
fn deploy_account_ok() {
    let pic = PocketIc::new();
    let central_id = pic.create_canister();
    pic.add_cycles(central_id, 2_000_000_000_000);
    let wasm_module =
        include_bytes!("../../../target/wasm32-unknown-unknown/release/central.wasm").to_vec();
    pic.install_canister(central_id, wasm_module, Vec::new(), None);

    let caller = generate_principal();

    let wasm_result = pic.update_call(
        central_id,
        caller,
        "deploy_account",
        encode_one(VaultInitArgs {
            name: "Funding".to_string(),
        })
        .unwrap(),
    );

    assert!(
        wasm_result.is_ok(),
        "Failed to execute update 'deploy_account': {}",
        wasm_result.unwrap_err()
    );

    let query_result = pic.query_call(central_id, caller, "get_user", encode_one(()).unwrap());

    match query_result.unwrap() {
        pocket_ic::WasmResult::Reply(bytes) => {
            let user_info = Decode!(&bytes, Option<UserData>);
            assert!(
                user_info.is_ok(),
                "Failed to decode UserInfo: {:?}",
                user_info.unwrap_err()
            );
            assert!(
                user_info.unwrap().is_some(),
                "Expected Some(UserInfo) but got None"
            );
        }
        pocket_ic::WasmResult::Reject(msg) => {
            panic!("Canister rejected 'get_user' call: {}", msg);
        }
    };
}

#[test]
fn deploy_account_should_not_return_error_if_user_not_registered() {
    let pic = PocketIc::new();
    let central_id = pic.create_canister();
    pic.add_cycles(central_id, 2_000_000_000_000);
    let wasm_module =
        include_bytes!("../../../target/wasm32-unknown-unknown/release/central.wasm").to_vec();
    pic.install_canister(central_id, wasm_module, Vec::new(), None);

    let caller = generate_principal();

    let wasm_result = pic.update_call(
        central_id,
        caller,
        "deploy_account",
        encode_one(
            VaultInitArgs {
                name: "Funding".to_string(),
            },
        )
        .unwrap(),
    );

    assert!(!wasm_result.is_err())
}

#[test]
fn load_wallet_wasm_blob_ok() {
    let pic = PocketIc::new();
    let central_id = pic.create_canister();
    pic.add_cycles(central_id, 2_000_000_000_000);

    let wasm_module =
        include_bytes!("../../../target/wasm32-unknown-unknown/release/central.wasm").to_vec();

    pic.install_canister(central_id, wasm_module, Vec::new(), None);

    let wasm_result = pic.query_call(
        central_id,
        Principal::anonymous(),
        "get_wasm",
        encode_one(()).unwrap(),
    );
    let x_wasm_bytes = match wasm_result.unwrap() {
        pocket_ic::WasmResult::Reply(bytes) => {
            let wasm_vec_bytes = Decode!(&bytes, Vec<u8>);
            assert!(
                wasm_vec_bytes.is_ok(),
                "Failed to decode WASM bytes: {:?}",
                wasm_vec_bytes.unwrap_err()
            );

            wasm_vec_bytes.unwrap()
        }
        pocket_ic::WasmResult::Reject(msg) => {
            panic!("Canister rejected 'get_wasm' call: {}", msg);
        }
    };

    let wasm_module =
        include_bytes!("../../../target/wasm32-unknown-unknown/release/account.wasm").to_vec();
    let gzip_result = gzip(wasm_module);
    let gzipped_blob = gzip_result.unwrap();
    let gzipped_blob_copy = gzipped_blob.clone();

    let wasm_result = pic.update_call(
        central_id,
        Principal::anonymous(),
        "load_wallet_wasm_blob",
        encode_one(gzipped_blob).unwrap(),
    );

    let query_result = pic.query_call(
        central_id,
        Principal::anonymous(),
        "get_wasm",
        encode_one(()).unwrap(),
    );

    let y_wasm_bytes = match query_result.unwrap() {
        pocket_ic::WasmResult::Reply(bytes) => {
            let wasm_vec_bytes = Decode!(&bytes, Vec<u8>);
            assert!(
                wasm_vec_bytes.is_ok(),
                "Failed to decode WASM bytes: {:?}",
                wasm_vec_bytes.unwrap_err()
            );

            wasm_vec_bytes.unwrap()
        }
        pocket_ic::WasmResult::Reject(msg) => {
            panic!("Canister rejected 'get_wasm' call: {}", msg);
        }
    };

    // WASM modules should be different
    assert!(!(x_wasm_bytes.iter().eq(&y_wasm_bytes)));
    // gzipped_blob and y_wasm_bytes should be equal
    assert!(y_wasm_bytes.iter().eq(&gzipped_blob_copy));
}

#[test]
fn user_vaults_should_be_empty_on_registration() {
    let pic = PocketIc::new();
    let central_id = pic.create_canister();
    pic.add_cycles(central_id, 2_000_000_000_000);
    let wasm_module =
        include_bytes!("../../../target/wasm32-unknown-unknown/release/central.wasm").to_vec();
    pic.install_canister(central_id, wasm_module, Vec::new(), None);

    let caller = generate_principal();

    let wasm_result = pic.update_call(central_id, caller, "register_user", encode_one(()).unwrap());

    assert!(
        wasm_result.is_ok(),
        "Failed to execute update 'register_user': {}",
        wasm_result.unwrap_err()
    );

    let query_result = pic.update_call(
        central_id,
        caller,
        "get_user_vaults",
        encode_one(()).unwrap(),
    );

    match query_result.unwrap() {
        pocket_ic::WasmResult::Reply(bytes) => {
            let user_vaults = Decode!(&bytes, Vec<Principal>);
            assert!(
                user_vaults.is_ok(),
                "Failed to decode Vec<Principal>: {:?}",
                user_vaults.unwrap_err()
            );
            assert!(
                user_vaults.unwrap().is_empty(),
                "Expected empty Vec<Principal> but got non-empty"
            );
        }
        pocket_ic::WasmResult::Reject(msg) => {
            panic!("Canister rejected 'get_user_vaults' call: {}", msg);
        }
    };
}

#[test]
fn deploy_account_should_add_to_vaults() {
    let pic = PocketIc::new();
    let central_id = pic.create_canister();
    pic.add_cycles(central_id, 2_000_000_000_000);
    let wasm_module =
        include_bytes!("../../../target/wasm32-unknown-unknown/release/central.wasm").to_vec();
    pic.install_canister(central_id, wasm_module, Vec::new(), None);

    let caller = generate_principal();

    let _ = pic.update_call(
        central_id,
        caller,
        "deploy_account",
        encode_one(
            VaultInitArgs {
                name: "Funding".to_string(),
            },
        )
        .unwrap(),
    );

    let query_result = pic.update_call(
        central_id,
        caller,
        "get_user_vaults",
        encode_one(()).unwrap(),
    );

    match query_result.unwrap() {
        pocket_ic::WasmResult::Reply(bytes) => {
            let user_vaults = Decode!(&bytes, Vec<Vault>);
            assert!(
                user_vaults.is_ok(),
                "Failed to decode Vec<Vault>: {:?}",
                user_vaults.unwrap_err()
            );
            assert!(
                !user_vaults.unwrap().is_empty(),
                "Expected non-empty Vec<Vault> but got empty"
            );
        }
        pocket_ic::WasmResult::Reject(msg) => {
            panic!("Canister rejected 'get_user_vaults' call: {}", msg);
        }
    };
}

#[test]
fn deploy_account_should_save_vault_name() {
    let pic = PocketIc::new();
    let central_id = pic.create_canister();
    pic.add_cycles(central_id, 2_000_000_000_000);
    let wasm_module =
        include_bytes!("../../../target/wasm32-unknown-unknown/release/central.wasm").to_vec();
    pic.install_canister(central_id, wasm_module, Vec::new(), None);

    let caller = generate_principal();

    let mock_name = "Funding".to_string();

    let deploy_account_result = pic.update_call(
        central_id,
        caller,
        "deploy_account",
        encode_one(
            VaultInitArgs {
                name: mock_name.clone(),
            },
        )
        .unwrap(),
    );

    let canister_id = match deploy_account_result {
        Ok(WasmResult::Reply(bytes)) => Decode!(&bytes, Principal).unwrap(),
        Ok(WasmResult::Reject(msg)) => {
            panic!("Canister rejected the 'deploy_account' call: {}", msg)
        }
        Err(e) => {
            panic!("Canister failed to deploy: {}", e)
        }
    };

    let query_result = pic.update_call(
        central_id,
        caller,
        "get_user_vaults",
        encode_one(()).unwrap(),
    );

    match query_result {
        Ok(WasmResult::Reply(bytes)) => {
            let user_vaults: Vec<Vault> = Decode!(&bytes, Vec<Vault>).unwrap();

            assert_eq!(user_vaults.len(), 1, "Expected one vault to be created");

            let created_vault = &user_vaults[0];
            assert_eq!(created_vault.name, mock_name, "Vault name doesn't match");
            assert_eq!(created_vault.id, canister_id, "Vault ID doesn't match");
        }
        Ok(WasmResult::Reject(msg)) => {
            panic!("Canister rejected 'get_user_vaults' call: {}", msg);
        }
        Err(e) => {
            panic!("Error calling 'get_user_vaults': {}", e);
        }
    };
}

#[test]
fn state_should_persist_as_stable_memory() {
    let pic = PocketIc::new();
    let central_id = pic.create_canister();
    pic.add_cycles(central_id, 2_000_000_000_000);
    let wasm_module =
        include_bytes!("../../../target/wasm32-unknown-unknown/release/central.wasm").to_vec();
    pic.install_canister(central_id, wasm_module, Vec::new(), None);

    let caller = generate_principal();

    let _ = pic.update_call(
        central_id,
        caller,
        "deploy_account",
        encode_one(
            VaultInitArgs {
                name: "Funding".to_string(),
            },
        )
        .unwrap(),
    );

    let wasm_module =
        include_bytes!("../../../target/wasm32-unknown-unknown/release/central.wasm").to_vec();
    let upgrade_result =
        pic.upgrade_canister(central_id, wasm_module, encode_one(()).unwrap(), None);

    match upgrade_result {
        Ok(()) => {
            let query_result = pic.update_call(
                central_id,
                caller,
                "get_user_vaults",
                encode_one(()).unwrap(),
            );

            match query_result.unwrap() {
                pocket_ic::WasmResult::Reply(bytes) => {
                    let user_vaults = Decode!(&bytes, Vec<Vault>);
                    assert!(
                        user_vaults.is_ok(),
                        "Failed to decode Vec<Vault>: {:?}",
                        user_vaults.unwrap_err()
                    );
                    assert!(
                        !user_vaults.unwrap().is_empty(),
                        "Expected non-empty Vec<Vault> but got empty"
                    );
                }
                pocket_ic::WasmResult::Reject(msg) => {
                    panic!("Canister rejected 'get_user_vaults' call: {}", msg);
                }
            };
        }
        Err(e) => {
            panic!("Failed to upgrade canister: {:?}", e);
        }
    }
}

#[test]
fn get_vault_by_id_should_return_none_if_vault_not_found() {
    let pic = PocketIc::new();
    let central_id = pic.create_canister();
    pic.add_cycles(central_id, 2_000_000_000_000);
    let wasm_module =
        include_bytes!("../../../target/wasm32-unknown-unknown/release/central.wasm").to_vec();
    pic.install_canister(central_id, wasm_module, Vec::new(), None);

    let query_result = pic.query_call(
        central_id,
        Principal::anonymous(),
        "get_vault_by_id",
        encode_one(Principal::anonymous()).unwrap(),
    );

    match query_result.unwrap() {
        pocket_ic::WasmResult::Reply(bytes) => {
            let vault = Decode!(&bytes, Option<Vault>);
            assert!(
                vault.is_ok(),
                "Failed to decode Option<Vault>: {:?}",
                vault.unwrap_err()
            );
            assert!(
                vault.unwrap().is_none(),
                "Expected None but got Some(Vault)"
            );
        }
        pocket_ic::WasmResult::Reject(msg) => {
            panic!("Canister rejected 'get_vault_by_id' call: {}", msg);
        }
    };
}
