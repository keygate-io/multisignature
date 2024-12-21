<<<<<<< HEAD
=======

>>>>>>> main
pub mod canister_init {
    use candid::{CandidType, Principal};
    use serde::{Deserialize, Serialize};

    #[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
    pub struct VaultInitArgs {
        pub name: String,
        pub signers: Vec<Principal>,
    }
<<<<<<< HEAD
}

pub mod vault {
    use std::borrow::Cow;

    use candid::{CandidType, Principal};
    use ic_stable_structures::{storable::Bound, Storable};
    use icrc_ledger_types::icrc1::account::Account;
    use serde::{Deserialize, Serialize};

    pub type TokenPath = String;

    #[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
    pub struct Vault {
        pub name: String,
        pub id: Principal,
    }

    #[derive(
        CandidType, Deserialize, Serialize, Debug, Clone, PartialEq, strum_macros::IntoStaticStr,
    )]
    pub enum TransactionType {
        Swap,
        Transfer,
    }

    pub mod ledger {
        pub const RECOMMENDED_ICP_TRANSACTION_FEE: u64 = 10000;
    }


    #[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
    pub struct ProposeTransactionArgs {
        pub to: String,
        pub token: TokenPath,
        pub network: SupportedNetwork,
        pub amount: f64,
        pub transaction_type: TransactionType,
    }

    #[derive(
    CandidType, Deserialize, Serialize, Debug, Clone, PartialEq, strum_macros::IntoStaticStr,
    )]
    pub enum IntentStatus {
        Pending(String),
        InProgress(String),
        Completed(String),
        Rejected(String),
        Failed(String),
    }

    #[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
    pub struct ProposedTransaction {
        pub id: u64,
        pub to: String,
        pub token: TokenPath,
        pub network: SupportedNetwork,
        pub amount: f64,
        pub transaction_type: TransactionType,
        pub signers: Vec<Principal>,
        pub rejections: Vec<Principal>,
    }

    impl Storable for ProposedTransaction {
        const BOUND: Bound = Bound::Bounded {
            max_size: 1024,
            is_fixed_size: false,
        };

        fn to_bytes(&self) -> Cow<[u8]> {
            let serialized = serde_cbor::to_vec(self).expect("Serialization failed");
            Cow::Owned(serialized)
        }

        fn from_bytes(bytes: Cow<[u8]>) -> Self {
            let deserialized: ProposedTransaction = serde_cbor::from_slice(&bytes.to_vec()).unwrap();
            deserialized
        }
    }

    #[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
    pub struct Intent {
        pub transaction_type: TransactionType,
        pub amount: f64,
        pub token: TokenPath,
        pub to: String,
        pub network: SupportedNetwork,
        pub status: IntentStatus,
    }

    impl Intent {
        pub fn network(&self) -> SupportedNetwork {
            self.network.clone()
        }

        pub fn token(&self) -> TokenPath {
            self.token.clone()
        }

        pub fn intent_type(&self) -> TransactionType {
            self.transaction_type.clone()
        }

        pub fn status(&self) -> IntentStatus {
            self.status.clone()
        }

        pub fn to(&self) -> String {
            self.to.clone()
        }

        pub fn amount(&self) -> f64 {
            self.amount
        }   
    }

    impl Storable for Intent {
        const BOUND: Bound = Bound::Bounded {
            max_size: 1024,
            is_fixed_size: false,
        };

        fn to_bytes(&self) -> Cow<[u8]> {
            let serialized = serde_cbor::to_vec(self).expect("Serialization failed");
            Cow::Owned(serialized)
        }

        fn from_bytes(bytes: Cow<[u8]>) -> Self {
            let deserialized: Intent = serde_cbor::from_slice(&bytes.to_vec()).unwrap();
            deserialized
        }
    }

    #[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
    pub enum SupportedNetwork {
        ICP,
        ETH,
        BTC,
    }

    #[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
    pub struct TransactionRequest {
        pub transaction_id: String,
        pub network: SupportedNetwork,
        pub amount: u128,
        pub to: Account,
        pub from: Account,
        pub memo: Option<Vec<u8>>,
    }

    // Types from the original code
    #[derive(CandidType, Serialize, Deserialize, Clone, Debug, Eq)]
    pub struct ArchiveOptions {
        pub num_blocks_to_archive: u64,
        pub trigger_threshold: u64,
        pub max_transactions_per_response: Option<u64>,
        pub max_message_size_bytes: Option<u64>,
        pub cycles_for_archive_creation: Option<candid::Nat>,
        pub node_max_memory_size_bytes: Option<candid::Nat>,
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

    #[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
    pub enum MetadataValue {
        Int(i128),
        Nat(u128),
        Blob(Vec<u8>),
        Text(String),
    }

    #[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
    pub enum ChangeFeeCollector {
        SetTo(Account),
        Unset,
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
}

pub mod central {
    use std::borrow::Cow;

    use candid::{CandidType, Principal};
    use ic_stable_structures::{storable::Bound, Storable};
    use serde::{Deserialize, Serialize};

    #[derive(Clone, CandidType, Deserialize, Serialize, Debug)]
    pub struct VaultInitArgs {
        pub name: String,
    }

    #[derive(Clone, CandidType, Deserialize, Serialize, Debug, PartialEq, Eq)]
    pub struct UserData {
        pub name: String, // Added for completeness
    }

    impl Storable for UserData {
        fn to_bytes(&self) -> Cow<'_, [u8]> {
            Cow::Owned(candid::encode_one(self).unwrap())
        }

        fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
            candid::decode_one(bytes.as_ref()).unwrap()
        }

        const BOUND: Bound = Bound::Bounded {
            max_size: MAX_VALUE_SIZE,
            is_fixed_size: false,
        };
    }

    #[derive(Clone, CandidType, Deserialize, Serialize, Debug, PartialEq, Eq)]
    pub struct Vault {
        pub name: String,
        pub id: Principal,
    }

    const MAX_VALUE_SIZE: u32 = 500;

    impl Storable for Vault {
        fn to_bytes(&self) -> Cow<'_, [u8]> {
            Cow::Owned(candid::encode_one(self).unwrap())
        }

        fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
            candid::decode_one(bytes.as_ref()).unwrap()
        }

        const BOUND: Bound = Bound::Bounded {
            max_size: MAX_VALUE_SIZE,
            is_fixed_size: false,
        };
    }
=======

>>>>>>> main
}
