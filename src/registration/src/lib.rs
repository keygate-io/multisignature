use std::collections::HashMap;
use std::cell::RefCell;

use ic_cdk::{query, update};
use candid::{CandidType, Deserialize, Principal};

#[derive(Clone, CandidType, Deserialize)]
struct UserInfo {
    first_name: String,
    last_name: String,
    accounts: Vec<Principal>,
}

thread_local! {
    static USERS: RefCell<HashMap<Principal, UserInfo>> = RefCell::default();
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