use ic_ledger_types::Subaccount;

pub fn to_subaccount(user_id: [u8; 29], account_number: [u8; 3]) -> Subaccount {
    let mut subaccount = Subaccount([0; 32]);
    
    // Copy the 29-bit user_id into the subaccount
    subaccount.0[0..29].copy_from_slice(&user_id);
    
    // Copy the 3-bit account_number into the last 3 bits of the subaccount
    subaccount.0[29..32].copy_from_slice(&account_number);
    
    subaccount
}