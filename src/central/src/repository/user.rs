use std::cell::RefCell;
use candid::Principal;
use ic_cdk::api::call::CallResult;
use ic_stable_structures::{memory_manager::VirtualMemory, StableBTreeMap, DefaultMemoryImpl};
use crate::types::{UserInfo, Vault};
use crate::{MEMORY_MANAGER, USERS_MEMORY, VAULTS_MEMORY, VAULT_NAMES_MEMORY};

pub struct UserRepository;

thread_local! {
    static USER_DB: RefCell<StableBTreeMap<Principal, UserInfo, VirtualMemory<DefaultMemoryImpl>>> = 
        RefCell::new(StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USERS_MEMORY))
        ));
    
    static VAULT_OWNERS_DB: RefCell<StableBTreeMap<Principal, Principal, VirtualMemory<DefaultMemoryImpl>>> = 
        RefCell::new(StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(VAULTS_MEMORY))
        ));

    static VAULT_NAMES_DB: RefCell<StableBTreeMap<Principal, String, VirtualMemory<DefaultMemoryImpl>>> = 
        RefCell::new(StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(VAULT_NAMES_MEMORY))
        ));
}

impl Default for UserRepository {
    fn default() -> Self {
        Self {}
    }
}

impl UserRepository {

    pub fn insert_user(&self, principal: Principal, user_info: UserInfo) -> Option<UserInfo> {
        USER_DB.with(|users| users.borrow_mut().insert(principal, user_info))
    }

    pub fn get_user(&self, principal: &Principal) -> Option<UserInfo> {
        USER_DB.with(|users| users.borrow().get(principal))
    }

    pub fn user_exists(&self, principal: &Principal) -> bool {
        USER_DB.with(|users| users.borrow().contains_key(principal))
    }

    pub fn create_vault(&self, vault_id: Principal, name: String, owner: Principal) -> Result<(), String> {
        if !self.user_exists(&owner) {
            return Err("Owner does not exist".to_string());
        }

        VAULT_OWNERS_DB.with(|vaults| {
            if vaults.borrow().contains_key(&vault_id) {
                return Err("Vault already exists".to_string());
            }
            vaults.borrow_mut().insert(vault_id, owner);
            Ok(())
        })?;

        VAULT_NAMES_DB.with(|names| {
            names.borrow_mut().insert(vault_id, name);
            Ok(())
        })
    }

    pub fn get_vault_owner(&self, vault_id: &Principal) -> Option<Principal> {
        VAULT_OWNERS_DB.with(|vaults| vaults.borrow().get(vault_id))
    }

    pub fn get_vault_by_id(&self, vault_id: &Principal) -> Option<Vault> {
        let name = VAULT_NAMES_DB.with(|names| names.borrow().get(&vault_id))?;
        
        Some(Vault {
            name,
            id: vault_id.clone(),
        })
    }

    /// Get all vaults for a user
    /// Note: This function only works when called from within a canister, as it uses ic_cdk::call 
    /// which is not available outside the Internet Computer runtime environment
    pub async fn get_user_vaults(&self, owner: &Principal) -> Vec<Vault> {
        let all_vaults: Vec<Principal> = VAULT_OWNERS_DB.with(|vaults| vaults.borrow().iter().map(|(k, _)| k).collect());

        let mut user_vaults = Vec::new();
        for vault_id in all_vaults {
            let signers: CallResult<(Vec<Principal>,)> =
                ic_cdk::call(vault_id, "get_signers", ()).await;

            match signers {
                Ok(signers) => {
                    if signers.0.contains(&owner) {
                        user_vaults.push(self.get_vault_by_id(&vault_id).unwrap());
                    }
                }
                Err(e) => {
                    ic_cdk::trap(&e.1);
                }
            }
        }

        user_vaults
    }
}

#[cfg(test)]
pub mod user_tests {
    use super::*;

    fn create_test_principal(id: u8) -> Principal {
        Principal::from_slice(&[id; 29])
    }

    #[test]
    fn test_user_operations() {
        let repo = UserRepository::default();
        let principal = create_test_principal(1);
        let user_info = UserInfo { name: "Test User".to_string() };

        assert!(!repo.user_exists(&principal));
        repo.insert_user(principal, user_info.clone());
        
        assert!(repo.user_exists(&principal));
        assert_eq!(repo.get_user(&principal), Some(user_info));
    }

    #[test]
    fn test_vault_creation() {
        let repo = UserRepository::default();
        let owner = create_test_principal(1);
        let vault_id = create_test_principal(2);
        
        // Create user first
        repo.insert_user(owner, UserInfo { name: "Test User".to_string() });

        // Create vault
        let result = repo.create_vault(vault_id, "Test Vault".to_string(), owner);
        assert!(result.is_ok());

        // Verify vault information
        assert_eq!(repo.get_vault_owner(&vault_id), Some(owner));
        let vault = repo.get_vault_by_id(&vault_id).unwrap();
        assert_eq!(vault.name, "Test Vault");
        assert_eq!(vault.id, vault_id);
    }

    #[test]
    fn test_create_vault_for_nonexistent_user() {
        let repo = UserRepository::default();
        let owner = create_test_principal(1);
        let vault_id = create_test_principal(2);

        let result = repo.create_vault(vault_id, "Test Vault".to_string(), owner);
        assert!(result.is_err());
    }
}