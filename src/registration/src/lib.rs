mod deployer;
mod types;

use std::{cell::RefCell};

use ic_cdk::{init, query, update};
use candid::Principal;
use ic_stable_structures::{memory_manager::{MemoryId, MemoryManager}, StableBTreeMap, DefaultMemoryImpl};
use types::{Memory, VaultName, UserInfo};

const USERS_MEMORY: MemoryId = MemoryId::new(0);
const VAULTS_MEMORY: MemoryId = MemoryId::new(1);

thread_local! {
    static WALLET_WASM: RefCell<Option<Vec<u8>>> = RefCell::default();

    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    pub static STABLE_USERS: RefCell<StableBTreeMap<Principal, UserInfo, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USERS_MEMORY))
        )
    );

    pub static STABLE_VAULTS: RefCell<StableBTreeMap<(Principal, VaultName), Principal, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(VAULTS_MEMORY))
        )
    );
}

#[init]
fn init() {
    load_wallet_wasm();
}

#[update]
fn register_user(principal: Principal, first_name: String, last_name: String) {
    STABLE_USERS.with(|users| {
        let mut users = users.borrow_mut();
        if users.contains_key(&principal) {
            ic_cdk::trap(&format!("User with principal {} already exists", principal));
        }
        users.insert(principal, UserInfo { first_name, last_name });
    });
}

fn add_account(user_principal: Principal, vault_name: String, account_canister_id: Principal) {
    STABLE_VAULTS.with(|vaults| {
        let mut vaults = vaults.borrow_mut();
        vaults.insert((user_principal, VaultName(vault_name)), account_canister_id);
    });
}

#[update]
async fn upgrade_account(vault_name: String) {
    let principal = ic_cdk::caller();

    let vault_canister_id = STABLE_VAULTS.with(|vaults| {
        vaults.borrow().get(&(principal, VaultName(vault_name)))
    }).expect("Vault not found");

    load_wallet_wasm();

    deployer::upgrade(vault_canister_id, WALLET_WASM.with(|wasm| wasm.borrow().clone().unwrap())).await.expect("Failed to upgrade account");
}

#[update]
async fn deploy_account(principal: Principal, vault_name: String) -> Principal {
    let wallet_wasm = WALLET_WASM.with(|wasm| {
        wasm.borrow().clone().unwrap_or_else(|| ic_cdk::trap("Wallet wasm not loaded"))
    });

    match deployer::deploy(wallet_wasm).await {
        Ok(canister_id) => {
            add_account(principal, vault_name, canister_id);
            canister_id
        }
        Err(err) => ic_cdk::trap(&format!("Failed to deploy account: {}", err)),
    }
}

#[update]
fn load_wallet_wasm() {
    let wasm_module: Vec<u8> = include_bytes!("../../../target/wasm32-unknown-unknown/release/account.wasm").to_vec();
    WALLET_WASM.with(|wasm| {
        *wasm.borrow_mut() = Some(wasm_module);
    });
}

#[query]
fn get_user(principal: Principal) -> Option<UserInfo> {
    STABLE_USERS.with(|users| users.borrow().get(&principal))
}

#[query]
fn get_user_vaults(principal: Principal) -> Vec<(String, Principal)> {
    STABLE_VAULTS.with(|vaults| {
        vaults.borrow().iter()
            .filter(|(key, _)| key.0 == principal)
            .map(|(key, value)| (key.1.0.clone(), value.clone()))
            .collect()
    })
}

#[query]
fn user_exists(principal: Principal) -> bool {
    STABLE_USERS.with(|users| users.borrow().contains_key(&principal))
}

#[ic_cdk::post_upgrade]
fn post_upgrade() {
    load_wallet_wasm();
}

ic_cdk::export_candid!();