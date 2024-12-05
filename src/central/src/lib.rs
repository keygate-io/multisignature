mod deployer;
pub mod types;
mod repository;

#[cfg(test)]
mod tests;

use std::cell::RefCell;

use candid::Principal;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager},
    DefaultMemoryImpl, StableBTreeMap,
};
use repository::UserRepository;
use types::{Memory, UserInfo, Vault, VaultInitArgs};

const USERS_MEMORY: MemoryId = MemoryId::new(0);
const VAULTS_MEMORY: MemoryId = MemoryId::new(1);
const VAULT_NAMES_MEMORY: MemoryId = MemoryId::new(2);

thread_local! {
    static WALLET_WASM: RefCell<Option<Vec<u8>>> = RefCell::default();

    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    pub static STABLE_USERS: RefCell<StableBTreeMap<Principal, UserInfo, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USERS_MEMORY))
        )
    );
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

    STABLE_USERS.with(|users| {
        let mut users = users.borrow_mut();
        if users.contains_key(&principal) {
            ic_cdk::trap(&format!("User with principal {} already exists", principal));
        }
        users.insert(principal, UserInfo { name: "".to_string() });
    });
}

#[ic_cdk::query]
fn get_vault_by_id(vault_id: Principal) -> Option<Vault> {
    let owner = STABLE_VAULTS.with(|vaults| vaults.borrow().get(&vault_id));

    if owner.is_none() {
        return None;
    }

    let user_info = STABLE_USERS.with(|users| users.borrow().get(&owner.unwrap()));

    let repository = UserRepository::default();

    let vault = repository.get_vault_by_id(&owner.unwrap()).unwrap();

    match user_info {
        Some(user) => Some(Vault {
            id: vault_id,
            name: vault.name,
        }),
        None => None,
    }
}

#[ic_cdk::update]
async fn upgrade_account(canister_id: Principal) -> Result<(), String> {
    let owner_principal = ic_cdk::caller();

    let canister_owner = STABLE_VAULTS.with(|vaults| vaults.borrow().get(&canister_id));

    if canister_owner != Some(owner_principal) {
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

fn user_exists(principal: Principal) -> bool {
    STABLE_USERS.with(|users| users.borrow().contains_key(&principal))
}

#[ic_cdk::update]
async fn deploy_account(args: VaultInitArgs) -> Principal {
    let owner_principal = ic_cdk::caller();
    if !user_exists(owner_principal) {
        register_user();
    }

    let wallet_wasm = WALLET_WASM.with(|wasm| {
        wasm.borrow()
            .clone()
            .unwrap_or_else(|| ic_cdk::trap("Wallet wasm not loaded"))
    });

    match deployer::deploy(wallet_wasm).await {
        Ok(canister_id) => {
            let repository = UserRepository::default();
            repository.create_vault(canister_id, args.name, owner_principal);

            canister_id
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
fn get_user() -> Option<UserInfo> {
    let principal = ic_cdk::caller();

    if !user_exists(principal) {
        ic_cdk::trap(&format!("User with principal {} not found", principal));
    }

    STABLE_USERS.with(|users| users.borrow().get(&principal))
}

#[ic_cdk::query]
async fn get_user_vaults() -> Vec<Vault> {
    let owner_principal = ic_cdk::caller();

    if !user_exists(owner_principal) {
        return vec![];
    }

    let repository = UserRepository::default();
    let user_vaults = repository.get_vaults_by_owner(&owner_principal);

    user_vaults
}

#[ic_cdk::post_upgrade]
fn post_upgrade() {
    load_wallet_wasm();
}

ic_cdk::export_candid!();
