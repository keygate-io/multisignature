use std::cell::RefCell;

use ic_cdk::{query, update};
use candid::{Principal};

thread_local! {
    static SIGNEES: RefCell<Vec<Principal>> = RefCell::default();
}

#[update]
fn include_signee(signee: String) {
    SIGNEES.with(|signees: &RefCell<Vec<Principal>>| {
        match Principal::from_text(signee) {
            Ok(x) => signees.borrow_mut().push(x),
            Err(x) => ic_cdk::trap(&format!("Could not parse signee principal: {}. Is it a valid principal?", x))
        }
    });
}

#[query]
fn get_signees() -> Vec<Principal> {
    SIGNEES.with(|signees: &RefCell<Vec<Principal>>| {
        signees.borrow().clone()
    })
}

ic_cdk_macros::export_candid!();
