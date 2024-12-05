use std::cell::RefCell;
use candid::Principal;
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

    pub fn get_user_vaults(&self, owner: &Principal) -> Vec<Vault> {
        // This would be replaced with actual get_signers() implementation
        let all_vaults = VAULT_OWNERS_DB.with(|vaults| {
            let vaults = vaults.borrow();
            vaults.iter()
                .filter(|(_, vault_owner)| vault_owner == owner)
                .map(|(vault_id, _)| vault_id)
                .collect::<Vec<_>>()
        });

        all_vaults.into_iter()
            .filter_map(|vault_id| self.get_vault_by_id(&vault_id))
            .collect()
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

    #[test]
    fn test_get_user_vaults() {
        let repo = UserRepository::default();
        let owner = create_test_principal(1);
        repo.insert_user(owner, UserInfo { name: "Test User".to_string() });

        let vault1_id = create_test_principal(2);
        let vault2_id = create_test_principal(3);

        repo.create_vault(vault1_id, "Vault 1".to_string(), owner).unwrap();
        repo.create_vault(vault2_id, "Vault 2".to_string(), owner).unwrap();

        let user_vaults = repo.get_user_vaults(&owner);
        assert_eq!(user_vaults.len(), 2);
        assert!(user_vaults.iter().any(|v| v.id == vault1_id && v.name == "Vault 1"));
        assert!(user_vaults.iter().any(|v| v.id == vault2_id && v.name == "Vault 2"));
    }

    #[test]
    fn test_multiple_users_with_vaults() {
        let repo = UserRepository::default();
        let owner1 = create_test_principal(1);
        let owner2 = create_test_principal(2);

        repo.insert_user(owner1, UserInfo { name: "User 1".to_string() });
        repo.insert_user(owner2, UserInfo { name: "User 2".to_string() });

        let vault1_id = create_test_principal(3);
        let vault2_id = create_test_principal(4);

        repo.create_vault(vault1_id, "Vault 1".to_string(), owner1).unwrap();
        repo.create_vault(vault2_id, "Vault 2".to_string(), owner2).unwrap();

        let user1_vaults = repo.get_user_vaults(&owner1);
        let user2_vaults = repo.get_user_vaults(&owner2);

        assert_eq!(user1_vaults.len(), 1);
        assert_eq!(user2_vaults.len(), 1);
        assert_eq!(user1_vaults[0].id, vault1_id);
        assert_eq!(user2_vaults[0].id, vault2_id);
    }
}