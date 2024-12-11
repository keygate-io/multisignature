use candid::{encode_one, Principal};
use central::types::{Vault, VaultInitArgs};
use pocket_ic::{query_candid_as, update_candid_as, PocketIc};
use crate::{setup::setup_new_env, utils::generate_principal, TestEnv};

#[test]
fn test_user_linked_vaults() {
   println!("Starting test_user_linked_vaults");
   
   println!("Setting up test environment");
   let TestEnv {
       env,
       canister_ids,
   } = setup_new_env();
   
   println!("Generating test principals");
   let bob = generate_principal();
   println!("Generated Bob's principal: {}", bob);
   
   let alice = generate_principal(); 
   println!("Generated Alice's principal: {}", alice);
   
   let charlie = generate_principal();
   println!("Generated Charlie's principal: {}", charlie);
   
   println!("Deploying vault as Alice");
   let (vault_id, ): (Principal,) = update_candid_as(
       &env,
       canister_ids.central,
       alice,
       "deploy_account",
       (VaultInitArgs {
           name: "Funding".to_string(),
       },),
   ).unwrap();

   println!("Vault deployed with ID: {}", vault_id);
   
   assert!(true);

   // Add Bob as a signer to the vault created by Alice
   let wasm_result: () = update_candid_as(
       &env,
       vault_id,
       alice,
       "add_signer",
       (bob,),
   ).unwrap();

   // Check that Alice can see the vault in her list of linked vaults 
   let alice_vaults: (Vec<Vault>, ) = query_candid_as(
       &env,
       canister_ids.central,
       alice,
       "get_user_vaults",
       (),
   ).unwrap();

   assert!(alice_vaults.0.iter().any(|vault| vault.id == vault_id));

   // Check that Bob can see the vault in his list of linked vaults
   let bob_vaults: (Vec<Vault>, ) = query_candid_as(
       &env,
       canister_ids.central,
       bob,
       "get_user_vaults",
       (),
   ).unwrap();

   assert!(bob_vaults.0.iter().any(|vault| vault.id == vault_id));

   println!("Test completed successfully");
}