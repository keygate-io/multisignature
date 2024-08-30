use crate::{hashof::HashOf, types::{CanisterApiManager, CanisterApiManagerTrait}};
use candid::CandidType;
use ic_ledger_types::{Memo, Subaccount, Tokens};
use serde::{de, de::Error, Deserialize, Serialize};
use serde_bytes::ByteBuf;
use sha2::{Digest, Sha256};
use std::{
    convert::TryInto,
    fmt::{Display, Formatter},
};
use strum_macros::IntoStaticStr;
use ic_ledger_types::AccountIdentifier as LedgerAccountIdentifier;


const HASH_LENGTH: usize = 32;

#[derive(Debug, PartialEq, Eq)]
pub struct ChecksumError {
    input: [u8; 32],
    expected_checksum: [u8; 4],
    found_checksum: [u8; 4],
}

impl Display for ChecksumError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Checksum failed for {}, expected check bytes {} but found {}",
            hex::encode(&self.input[..]),
            hex::encode(self.expected_checksum),
            hex::encode(self.found_checksum),
        )
    }
}

#[derive(Debug, PartialEq, Eq)]
pub enum AccountIdParseError {
    InvalidChecksum(ChecksumError),
    InvalidLength(Vec<u8>),
}

impl AccountIdentifier {
    pub fn from_hex(hex_str: &str) -> Result<AccountIdentifier, String> {
        let hex: Vec<u8> = hex::decode(hex_str).map_err(|e| e.to_string())?;
        Self::from_slice(&hex[..]).map_err(|err| match err {
            // Since the input was provided in hex, return an error that is hex-friendly.
            AccountIdParseError::InvalidLength(_) => format!(
                "{} has a length of {} but we expected a length of 64 or 56",
                hex_str,
                hex_str.len()
            ),
            AccountIdParseError::InvalidChecksum(err) => err.to_string(),
        })
    }

    /// Converts a blob into an `AccountIdentifier`.
    ///
    /// The blob can be either:
    ///
    /// 1. The 32-byte canonical format (4 byte checksum + 28 byte hash).
    /// 2. The 28-byte hash.
    ///
    /// If the 32-byte canonical format is provided, the checksum is verified.
    pub fn from_slice(v: &[u8]) -> Result<AccountIdentifier, AccountIdParseError> {
        // Try parsing it as a 32-byte blob.
        match v.try_into() {
            Ok(h) => {
                // It's a 32-byte blob. Validate the checksum.
                check_sum(h).map_err(AccountIdParseError::InvalidChecksum)
            }
            Err(_) => {
                // Try parsing it as a 28-byte hash.
                match v.try_into() {
                    Ok(hash) => Ok(AccountIdentifier { hash }),
                    Err(_) => Err(AccountIdParseError::InvalidLength(v.to_vec())),
                }
            }
        }
    }

    pub fn to_hex(self) -> String {
        hex::encode(self.to_vec())
    }

    pub fn to_vec(self) -> Vec<u8> {
        [&self.generate_checksum()[..], &self.hash[..]].concat()
    }

    pub fn generate_checksum(self) -> [u8; 4] {
        let mut hasher = crc32fast::Hasher::new();
        hasher.update(&self.hash);
        hasher.finalize().to_be_bytes()
    }
}

fn check_sum(hex: [u8; 32]) -> Result<AccountIdentifier, ChecksumError> {
    // Get the checksum provided
    let found_checksum = &hex[0..4];

    // Copy the hash into a new array
    let mut hash = [0; 28];
    hash.copy_from_slice(&hex[4..32]);

    let account_id = AccountIdentifier { hash };
    let expected_checksum = account_id.generate_checksum();

    // Check the generated checksum matches
    if expected_checksum == found_checksum {
        Ok(account_id)
    } else {
        Err(ChecksumError {
            input: hex,
            expected_checksum,
            found_checksum: found_checksum.try_into().unwrap(),
        })
    }
}

#[derive(
    Debug, Clone, Copy, CandidType, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord, Hash,
)]
pub struct TimeStamp {
    pub timestamp_nanos: u64,
}

impl<'de> Deserialize<'de> for AccountIdentifier {
    // This is the canonical way to read a this from string
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
        D::Error: de::Error,
    {
        let hex: [u8; 32] = hex::serde::deserialize(deserializer)?;
        check_sum(hex).map_err(D::Error::custom)
    }
}

#[derive(CandidType, Clone, Copy, Hash, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct AccountIdentifier {
    pub hash: [u8; 28],
}

impl Serialize for AccountIdentifier {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.to_hex().serialize(serializer)
    }
}

/// An operation which modifies account balances
#[derive(
    Serialize,
    Deserialize,
    CandidType,
    Clone,
    Hash,
    Debug,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    IntoStaticStr,
)]
pub enum Operation {
    Burn {
        from: AccountIdentifier,
        amount: Tokens,
        #[serde(skip_serializing_if = "Option::is_none")]
        spender: Option<AccountIdentifier>,
    },
    Mint {
        to: AccountIdentifier,
        amount: Tokens,
    },
    Transfer {
        from: AccountIdentifier,
        to: AccountIdentifier,
        amount: Tokens,
        fee: Tokens,
        #[serde(skip_serializing_if = "Option::is_none")]
        spender: Option<AccountIdentifier>,
    },
    Approve {
        from: AccountIdentifier,
        spender: AccountIdentifier,
        allowance: Tokens,
        expected_allowance: Option<Tokens>,
        expires_at: Option<TimeStamp>,
        fee: Tokens,
    },
}

#[derive(
    Serialize, Deserialize, CandidType, Clone, Hash, Debug, PartialEq, Eq, PartialOrd, Ord,
)]
pub struct Transaction {
    pub operation: Operation,
    pub memo: Memo,
    /// The time this transaction was created.
    pub created_at_time: Option<TimeStamp>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icrc1_memo: Option<ByteBuf>,
}

impl Transaction {
    pub fn new(
        from: AccountIdentifier,
        to: AccountIdentifier,
        spender: Option<AccountIdentifier>,
        amount: Tokens,
        fee: Tokens,
        memo: Memo,
        created_at_time: TimeStamp,
    ) -> Self {
        let operation = Operation::Transfer {
            from,
            to,
            spender,
            amount,
            fee,
        };
        Transaction {
            operation,
            memo,
            icrc1_memo: None,
            created_at_time: Some(created_at_time),
        }
    }
}

pub trait LedgerTransaction: Sized {
    type AccountId: Clone;
    // type Tokens: Tokens;

    /// Returns the hash of this transaction.
    fn generate_hash(&self) -> HashOf<Self>;
}

impl LedgerTransaction for Transaction {
    type AccountId = AccountIdentifier;
    // type Tokens = Tokens;

    fn generate_hash(&self) -> HashOf<Self> {
        let mut state = Sha256::new();
        state.update(&serde_cbor::ser::to_vec_packed(&self).unwrap());
        let result = state.finalize();
        let fixed_result: [u8; HASH_LENGTH] = result.into();
        HashOf::new(fixed_result)
    }
}

pub fn to_subaccount(nonce: u32) -> Subaccount {
    let mut subaccount = Subaccount([0; 32]);
    let nonce_bytes = nonce.to_be_bytes();
    subaccount.0[32 - nonce_bytes.len()..].copy_from_slice(&nonce_bytes);
    subaccount
}

pub fn to_subaccount_id(subaccount: Subaccount) -> LedgerAccountIdentifier {
    let principal_id = CanisterApiManager::id();
    LedgerAccountIdentifier::new(&principal_id, &subaccount)
}

pub fn hash_transaction(tx: &crate::types::Transaction) -> Result<String, String> {
    let transfer = match &tx.operation {
        Some(crate::types::Operation::Transfer(transfer)) => transfer,
        _ => return Err("tx.operation should always be Operation::Transfer".to_string()),
    };

    let from_account = AccountIdentifier::from_slice(transfer.from.as_slice())
        .map_err(|e| format!("Failed to create from: {:?}", e))?;

    let to_account = AccountIdentifier::from_slice(transfer.to.as_slice())
        .map_err(|e| format!("Failed to create to: {:?}", e))?;

    let spender = transfer.spender.as_ref().map(|spender| {
        AccountIdentifier::from_slice(spender.as_slice())
            .map_err(|e| format!("Failed to create spender: {:?}", e))
    }).transpose()?;

    let tx_hash = Transaction::new(
        from_account,
        to_account,
        spender,
        Tokens::from_e8s(transfer.amount.e8s),
        Tokens::from_e8s(transfer.fee.e8s),
        Memo(tx.memo),
        TimeStamp {
            timestamp_nanos: tx.created_at_time.timestamp_nanos,
        },
    )
    .generate_hash();

    Ok(tx_hash.to_hex())
}

