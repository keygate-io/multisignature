use candid::{CandidType, Nat, Principal};
use ic_cdk::api::call::CallResult;
use ic_ledger_types::{Subaccount, AccountBalanceArgs, AccountIdentifier, Tokens, DEFAULT_SUBACCOUNT};
use ic_stable_structures::storable::{Bound, Storable};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::{TransferArg, TransferError};
use pocket_ic::{query_candid_as, update_candid_as, PocketIc, WasmResult};
use serde::{Deserialize, Serialize};
use serde_bytes::ByteBuf;
use std::any::Any;
use std::borrow::Cow;
use std::collections::{HashMap, HashSet};
use std::str::FromStr;
use std::time::Duration;

#[derive(Clone, Eq, PartialEq, Debug, CandidType, Deserialize, Serialize)]
pub struct NnsLedgerCanisterInitPayload {
    pub minting_account: String,
    pub icrc1_minting_account: Option<Account>,
    pub initial_values: Vec<(String, Tokens)>,
    pub max_message_size_bytes: Option<usize>,
    pub transaction_window: Option<Duration>,
    pub archive_options: Option<ArchiveOptions>,
    pub send_whitelist: HashSet<Principal>,
    pub transfer_fee: Option<Tokens>,
    pub token_symbol: Option<String>,
    pub token_name: Option<String>,
    pub feature_flags: Option<FeatureFlags>,
    pub maximum_number_of_accounts: Option<usize>,
    pub accounts_overflow_trim_quantity: Option<usize>,
}

#[derive(Clone, Eq, PartialEq, Debug, CandidType, Deserialize, Serialize)]
pub struct NnsLedgerCanisterUpgradePayload {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub icrc1_minting_account: Option<Account>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub feature_flags: Option<FeatureFlags>,
}

#[derive(Clone, Eq, PartialEq, Debug, CandidType, Deserialize, Serialize)]
pub enum LedgerCanisterPayload {
    Init(NnsLedgerCanisterInitPayload),
    Upgrade(Option<NnsLedgerCanisterUpgradePayload>),
}

#[derive(Default, CandidType, Deserialize, Serialize)]
pub struct Cbor32(pub [u8; 32]);

impl Storable for Cbor32 {
    const BOUND: Bound = Bound::Bounded {
        max_size: 32,
        is_fixed_size: true,
    };

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        let mut buf = vec![];
        ciborium::ser::into_writer(&self.0, &mut buf).unwrap();
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        Self(ciborium::de::from_reader(bytes.as_ref()).unwrap())
    }
}

pub struct CborSubaccount(pub Subaccount);

impl Storable for CborSubaccount {
    const BOUND: Bound = Bound::Bounded {
        max_size: 34,
        is_fixed_size: true,
    };

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        let mut buf = vec![];
        ciborium::ser::into_writer(&self.0, &mut buf).unwrap();
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        Self(ciborium::de::from_reader(bytes.as_ref()).unwrap())
    }
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ICRC1Args {
    Init(ICRC1InitArgs),
    Upgrade(ICRC1UpgradeArgs),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ICRC1InitArgs {
    pub token_symbol: String,
    pub token_name: String,
    pub minting_account: Account,
    pub fee_collector_account: Option<Account>,
    pub metadata: Vec<(String, MetadataValue)>,
    pub archive_options: ArchiveOptions,
    pub feature_flags: Option<FeatureFlags>,
    pub initial_balances: Vec<(Account, u128)>,
    pub max_memo_length: Option<u16>,
    pub transfer_fee: u128,
    pub decimals: Option<u8>,
    pub maximum_number_of_accounts: Option<u64>,
    pub accounts_overflow_trim_quantity: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ICRC1UpgradeArgs {
    pub token_symbol: Option<String>,
    pub token_name: Option<String>,
    pub metadata: Option<Vec<(String, MetadataValue)>>,
    pub change_fee_collector: Option<ChangeFeeCollector>,
    pub feature_flags: Option<FeatureFlags>,
    pub transfer_fee: Option<u128>,
    pub maximum_number_of_accounts: Option<u64>,
    pub accounts_overflow_trim_quantity: Option<u64>,
    pub max_memo_length: Option<u16>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ChangeFeeCollector {
    SetTo(Account),
    Unset,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum MetadataValue {
    Int(i128),
    Nat(u128),
    Blob(Vec<u8>),
    Text(String),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Eq)]
pub struct ArchiveOptions {
    pub num_blocks_to_archive: u64,
    pub trigger_threshold: u64,
    pub max_transactions_per_response: Option<u64>,
    pub max_message_size_bytes: Option<u64>,
    pub cycles_for_archive_creation: Option<Nat>,
    pub node_max_memory_size_bytes: Option<Nat>,
    pub controller_id: Principal,
}

impl PartialEq for ArchiveOptions {
    fn eq(&self, other: &Self) -> bool {
        self.num_blocks_to_archive == other.num_blocks_to_archive
            && self.trigger_threshold == other.trigger_threshold
            && self.max_transactions_per_response == other.max_transactions_per_response
            && self.max_message_size_bytes == other.max_message_size_bytes
            && self.cycles_for_archive_creation == other.cycles_for_archive_creation
            && self.node_max_memory_size_bytes == other.node_max_memory_size_bytes
            && self.controller_id == other.controller_id
    }
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Eq)]
pub struct FeatureFlags {
    pub icrc2: bool,
}

impl PartialEq for FeatureFlags {
    fn eq(&self, other: &Self) -> bool {
        self.icrc2 == other.icrc2
    }
}