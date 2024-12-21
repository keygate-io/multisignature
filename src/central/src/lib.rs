mod deployer;
pub mod types;
mod repository;

use std::cell::RefCell;

use candid::Principal;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager},
    DefaultMemoryImpl,
};
use repository::UserRepository;
use keygate_core::types::central::{UserData, Vault, VaultInitArgs};

const USERS_MEMORY: MemoryId = MemoryId::new(0);
const VAULTS_MEMORY: MemoryId = MemoryId::new(1);
const VAULT_NAMES_MEMORY: MemoryId = MemoryId::new(2);

thread_local! {
    static WALLET_WASM: RefCell<Option<Vec<u8>>> = RefCell::default();

    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
}

#[ic_cdk::query]
fn get_wasm() -> Vec<u8> {
    WALLET_WASM.with(|wasm| wasm.borrow().clone().unwrap())
}

#[ic_cdk::init]
fn init() {
    load_wallet_wasm();
}

#[ic_cdk::update]
fn register_user() {
    let principal = ic_cdk::caller();

    let repository = UserRepository::default();
    if repository.user_exists(&principal) {
        return;
    }

    repository.insert_user(principal, UserData { name: "N/A".to_string() });
}

#[ic_cdk::query]
fn get_vault_by_id(vault_id: Principal) -> Option<Vault> {
    let repository = UserRepository::default();
    let vault = repository.get_vault_by_id(&vault_id);

    if vault.is_none() {
        return None;
    }

    Some(vault.unwrap())
}

#[ic_cdk::update]
async fn upgrade_account(canister_id: Principal) -> Result<(), String> {
    let owner_principal = ic_cdk::caller();

    let repository = UserRepository::default();
    let vault = repository.get_vault_by_id(&canister_id);

    if vault.is_none() {
        return Err(format!("Vault with id {} not found", canister_id));
    }

    let owner = repository.get_vault_owner(&canister_id);

    if owner.is_none() || owner.unwrap() != owner_principal {
        return Err(format!(
            "Only the owner of the vault canister can upgrade it"
        ));
    }

    load_wallet_wasm();

    match deployer::upgrade(
        canister_id,
        WALLET_WASM.with(|wasm| wasm.borrow().clone().unwrap()),
    )
    .await
    {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to upgrade account: {}", e)),
    }
}

#[ic_cdk::update]
async fn deploy_account(args: VaultInitArgs) -> Principal {
    let owner_principal = ic_cdk::caller();
    let repository = UserRepository::default();
    if !repository.user_exists(&owner_principal) {
        register_user();
    }

    let wallet_wasm = WALLET_WASM.with(|wasm| {
        wasm.borrow()
            .clone()
            .unwrap_or_else(|| ic_cdk::trap("Wallet wasm not loaded"))
    });

    match deployer::deploy(wallet_wasm).await {
        Ok(canister_id) => {
            let result = repository.create_vault(canister_id, args.name, owner_principal);

            match result {
                Ok(_) => canister_id,
                Err(e) => ic_cdk::trap(&e),
            }
        }
        Err(err) => ic_cdk::trap(&format!("Failed to deploy account: {}", err)),
    }
}

#[ic_cdk::update]
fn load_wallet_wasm() {
    let wasm_module: Vec<u8> =
        include_bytes!("../../../target/wasm32-unknown-unknown/release/account.wasm").to_vec();
    WALLET_WASM.with(|wasm| {
        *wasm.borrow_mut() = Some(wasm_module);
    });

    ic_cdk::println!("Loaded wallet wasm");
}

#[ic_cdk::update]
fn load_wallet_wasm_blob(wasm_blob: Vec<u8>) {
    WALLET_WASM.with(|wasm| {
        *wasm.borrow_mut() = Some(wasm_blob);
    });
}

#[ic_cdk::query]
fn get_user() -> Option<UserData> {
    let principal = ic_cdk::caller();
    let repository = UserRepository::default();

    if !repository.user_exists(&principal) {
        ic_cdk::trap(&format!("User with principal {} not found", principal));
    }

    repository.get_user(&principal)
}

#[ic_cdk::update]
async fn get_user_vaults() -> Vec<Vault> {
    let owner_principal = ic_cdk::caller();
    let repository = UserRepository::default();
    
    ic_cdk::println!("Getting user vaults for principal {}", owner_principal.to_text());

    let user_vaults = repository.get_user_vaults(&owner_principal).await;

    user_vaults
}

#[ic_cdk::post_upgrade]
fn post_upgrade() {
    load_wallet_wasm();
}

ic_cdk::export_candid!();
