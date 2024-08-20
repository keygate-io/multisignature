mod deployer;
mod memory;
mod subaccount;
mod types;

use std::collections::HashMap;
use std::cell::RefCell;

use ic_cdk::{init, query, update};
use candid::{CandidType, Deserialize, Principal};
use memory::LAST_SUBACCOUNT_NONCE;
use subaccount::to_subaccount;
use types::Error;

#[derive(Clone, CandidType, Deserialize)]
struct UserInfo {
    first_name: String,
    last_name: String,
    accounts: Vec<Principal>,
}

thread_local! {
    static USERS: RefCell<HashMap<Principal, UserInfo>> = RefCell::default();
    static WALLET_WASM: RefCell<Option<Vec<u8>>> = RefCell::default();
    
}

fn nonce() -> u32 {
    LAST_SUBACCOUNT_NONCE.with(|nonce_ref| *nonce_ref.borrow().get())
}

#[init]
fn init() {
    load_wallet_wasm();
}

#[update]
fn register_user(principal: Principal, first_name: String, last_name: String) {
    USERS.with(|users| {
        let mut users = users.borrow_mut();
        if users.contains_key(&principal) {
            ic_cdk::trap(&format!("User with principal {} already exists", principal));
        }
        users.insert(principal, UserInfo { first_name, last_name, accounts: Vec::new() });
    });
}

#[update]
fn add_account(principal: Principal, account: Principal) {
    USERS.with(|users| {
        let mut users = users.borrow_mut();
        let user = users.get_mut(&principal).unwrap_or_else(|| ic_cdk::trap("User not found"));
        user.accounts.push(account);
    });
}

#[update]
async fn add_subaccount() -> Result<String, Error> {
    let principal = ic_cdk::caller();
    let user = USERS.with(|users| {
        users.borrow().get(&principal).cloned()
    }).ok_or(Error { message: "User not found".to_string() })?;
    let account_length = user.accounts.len() as u32;
    let subaccount_nonce = nonce();
    let subaccount = to_subaccount(subaccount_nonce, account_length);
    Ok("Subaccount added".to_string())
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
    USERS.with(|users| {
        users.borrow().get(&principal).cloned()
    })
}

#[query]
fn user_exists(principal: Principal) -> bool {
    USERS.with(|users| {
        users.borrow().contains_key(&principal)
    })
}

ic_cdk::export_candid!();