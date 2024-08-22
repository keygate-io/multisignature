use candid::Principal;

pub struct UserAccount {
    id: Principal,
    token: String, // Hardcoded to ICP for now
}

