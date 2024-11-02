use candid::{CandidType, Principal};
use ic_cdk::api;
use serde::Deserialize;

#[derive(CandidType, Deserialize)]
pub enum InstallMode {
    #[serde(rename = "install")]
    Install,
    #[serde(rename = "reinstall")]
    Reinstall,
    #[serde(rename = "upgrade")]
    Upgrade,
}

#[derive(CandidType, Deserialize)]
pub struct CanisterInstall {
    mode: InstallMode,
    canister_id: Principal,
    #[serde(with = "serde_bytes")]
    wasm_module: Vec<u8>,
    arg: Vec<u8>,
}

#[derive(CandidType, Deserialize)]
struct DeploymentResult {
    canister_id: Principal,
}

pub async fn deploy(bytecode: Vec<u8>) -> Result<Principal, String> {
    let management_canister = Principal::management_canister();

    let create_result: Result<(DeploymentResult,), _> = api::call::call_with_payment128(
        management_canister,
        "create_canister",
        (),
        240000000000u128,
    )
    .await;

    let create_result = match create_result {
        Ok((result,)) => result,
        Err((code, msg)) => {
            ic_cdk::api::print(format!(
                "Error creating canister: Code: {}, Message: {}",
                code as u8, msg
            ));
            return Err(format!(
                "Failed to create canister: {}: {}",
                code as u8, msg
            ));
        }
    };

    let install_config = CanisterInstall {
        mode: InstallMode::Install,
        canister_id: create_result.canister_id,
        wasm_module: bytecode.clone(),
        arg: b" ".to_vec(),
    };

    match api::call::call(
        Principal::management_canister(),
        "install_code",
        (install_config,),
    )
    .await
    {
        Ok(x) => x,
        Err((code, msg)) => {
            return Err(format!(
                "An error happened during the call: {}: {}",
                code as u8, msg
            ))
        }
    };

    let id = create_result.canister_id.clone();
    Ok(id)
}

pub async fn upgrade(canister_id: Principal, bytecode: Vec<u8>) -> Result<(), String> {
    let install_config = CanisterInstall {
        mode: InstallMode::Upgrade,
        canister_id: canister_id,
        wasm_module: bytecode.clone(),
        arg: b" ".to_vec(),
    };

    match api::call::call(
        Principal::management_canister(),
        "install_code",
        (install_config,),
    )
    .await
    {
        Ok(x) => x,
        Err((code, msg)) => {
            return Err(format!(
                "An error happened during the call: {}: {}",
                code as u8, msg
            ))
        }
    };

    Ok(())
}
