use ic_ledger_types::Subaccount;

/// Converts a user ID and account number into a `Subaccount`.
///
/// The `Subaccount` is a 32-byte array where the first 29 bytes are copied from the `user_id`
/// and the last 3 bytes are copied from the `account_number`.
///
/// # Arguments
///
/// * `user_id` - A 29-byte array representing the user ID.
/// * `account_number` - A 3-byte array representing the account number.
///
/// # Returns
///
/// A `Subaccount` containing the combined user ID and account number.
///
/// # Example
///
/// ```
/// let user_id = [1; 29];
/// let account_number = [2; 3];
/// let subaccount = to_subaccount(user_id, account_number);
/// assert_eq!(subaccount.0[..29], user_id);
/// assert_eq!(subaccount.0[29..], account_number);
/// ```
pub fn to_subaccount(user_id: [u8; 29], account_number: [u8; 3]) -> Subaccount {
    let mut subaccount = Subaccount([0; 32]);
    
    // Copy the 29-bit user_id into the subaccount
    subaccount.0[0..29].copy_from_slice(&user_id);
    
    // Copy the 3-bit account_number into the last 3 bits of the subaccount
    subaccount.0[29..32].copy_from_slice(&account_number);
    
    subaccount
}