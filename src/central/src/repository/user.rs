pub struct UserRepository;


thread_local! {
    static USER_DB: RefCell<StableBTreeMap<Principal, UserInfo, VirtualMemory<DefaultMemoryImpl>>> = 
        RefCell::new(StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USER_MEMORY_ID))
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

    pub fn insert_vault(&self, vault_id: Principal, owner: Principal) {
        VAULT_DB.with(|vaults| vaults.borrow_mut().insert(vault_id, owner));
    }

    pub fn get_vault_owner(&self, vault_id: &Principal) -> Option<Principal> {
        VAULT_DB.with(|vaults| vaults.borrow().get(vault_id))
    }

    pub fn get_vault_by_id(&self, vault_id: Principal) -> Option<Vault> {
        let owner = self.get_vault_owner(&vault_id)?;
        let user_info = self.get_user(&owner)?;
        
        user_info.vaults.iter()
            .find(|vault| vault.id == vault_id)
            .cloned()
    }

    pub fn add_vault_to_user(&self, owner: Principal, vault: Vault) -> Result<(), String> {
        USER_DB.with(|users| {
            let mut users = users.borrow_mut();
            let mut user_info = users.get(&owner)
                .ok_or_else(|| format!("User with principal {} not found", owner))?;
            
            user_info.vaults.push(vault);
            users.insert(owner, user_info);
            Ok(())
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use candid::Principal;

    fn create_test_principal(id: u8) -> Principal {
        Principal::from_slice(&[id; 29])
    }

    fn create_test_vault(name: &str, id: u8) -> Vault {
        Vault {
            name: name.to_string(),
            id: create_test_principal(id),
        }
    }

    #[test]
    fn test_user_insert_and_get() {
        let repo = UserRepository::default();
        let principal = create_test_principal(1);
        let user_info = UserInfo { vaults: vec![] };

        assert!(!repo.user_exists(&principal));
        repo.insert_user(principal, user_info.clone());
        
        assert!(repo.user_exists(&principal));
        assert_eq!(repo.get_user(&principal), Some(user_info));
    }

    #[test]
    fn test_vault_operations() {
        let repo = UserRepository::default();
        let owner = create_test_principal(1);
        let vault_id = create_test_principal(2);
        
        repo.insert_vault(vault_id, owner);
        assert_eq!(repo.get_vault_owner(&vault_id), Some(owner));
    }

    #[test]
    fn test_add_vault_to_user() {
        let repo = UserRepository::default();
        let owner = create_test_principal(1);
        let user_info = UserInfo { vaults: vec![] };
        repo.insert_user(owner, user_info);

        let vault = create_test_vault("Test Vault", 2);
        let result = repo.add_vault_to_user(owner, vault.clone());
        assert!(result.is_ok());

        let updated_user = repo.get_user(&owner).unwrap();
        assert_eq!(updated_user.vaults.len(), 1);
        assert_eq!(updated_user.vaults[0], vault);
    }

    #[test]
    fn test_add_vault_to_nonexistent_user() {
        let repo = UserRepository::default();
        let owner = create_test_principal(1);
        let vault = create_test_vault("Test Vault", 2);

        let result = repo.add_vault_to_user(owner, vault);
        assert!(result.is_err());
    }

    #[test]
    fn test_get_vault_by_id() {
        let repo = UserRepository::default();
        let owner = create_test_principal(1);
        let vault = create_test_vault("Test Vault", 2);
        
        repo.insert_user(owner, UserInfo { vaults: vec![] });
        repo.insert_vault(vault.id, owner);
        repo.add_vault_to_user(owner, vault.clone()).unwrap();

        assert_eq!(repo.get_vault_by_id(vault.id), Some(vault));
    }

    #[test]
    fn test_get_nonexistent_vault() {
        let repo = UserRepository::default();
        let vault_id = create_test_principal(1);

        assert_eq!(repo.get_vault_by_id(vault_id), None);
    }

    #[test]
    fn test_multiple_vaults_per_user() {
        let repo = UserRepository::default();
        let owner = create_test_principal(1);
        repo.insert_user(owner, UserInfo { vaults: vec![] });

        let vault1 = create_test_vault("Vault 1", 2);
        let vault2 = create_test_vault("Vault 2", 3);

        repo.insert_vault(vault1.id, owner);
        repo.insert_vault(vault2.id, owner);
        repo.add_vault_to_user(owner, vault1.clone()).unwrap();
        repo.add_vault_to_user(owner, vault2.clone()).unwrap();

        let user = repo.get_user(&owner).unwrap();
        assert_eq!(user.vaults.len(), 2);
        assert!(user.vaults.contains(&vault1));
        assert!(user.vaults.contains(&vault2));
    }
}