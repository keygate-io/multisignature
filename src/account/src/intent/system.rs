use std::{borrow::Cow, collections::{LinkedList}};

use candid::{CandidType, Principal};
use ic_cdk::{query, update};
use ic_stable_structures::{storable::Bound, Storable};
use serde::{Deserialize, Serialize};

use crate::{ADAPTERS, DECISIONS, INTENTS};

#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq, strum_macros::IntoStaticStr)]
pub enum IntentType {
    Swap,
    Transfer,
}

#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq, strum_macros::IntoStaticStr)]
pub enum IntentStatus {
    Pending(String),
    InProgress(String),
    Completed(String),
    Rejected(String),
    Failed(String),
}

#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq, strum_macros::IntoStaticStr)]
pub enum SupportedNetwork {
    ICP,
    ETH
}


#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub struct Intent {
    intent_type: IntentType,
    amount: u64,
    token: String,
    to: String,
    from: String,
    network: SupportedNetwork,
    status: IntentStatus
}

impl Intent {

    pub fn network(&self) -> SupportedNetwork {
        self.network.clone()
    }

    pub fn token(&self) -> String {
        self.token.clone()
    }

    pub fn intent_type(&self) -> IntentType {
        self.intent_type.clone()
    }

    pub fn status(&self) -> IntentStatus {
        self.status.clone()
    }

    pub fn from(&self) -> String {
        self.from.clone()
    }

    pub fn to(&self) -> String {
        self.to.clone()
    }

    pub fn amount(&self) -> u64 {
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

#[derive(CandidType, Deserialize, Serialize, Debug, Clone, PartialEq)]
pub struct Decision {
    id: u64,
    intent_id: u64,
    signee: Principal,
    approved: bool
}

impl Decision {
    pub fn new(id: u64, intent_id: u64, signee: Principal, approved: bool) -> Decision {
        Decision {
            id,
            intent_id,
            signee,
            approved
        }
    }

    pub fn id(&self) -> u64 {
        self.id
    }

    pub fn approved(&self) -> bool {
        self.approved
    }
}

#[query]
pub fn get_adapters() -> Vec<String> {
    ADAPTERS.with(|adapters| {
        adapters.borrow().keys().cloned().collect()
    })
}

#[update]
pub fn add_intent(intent: Intent) -> u64 {
    let mut id = 0;

    INTENTS.with(|intents| {
        id = intents.borrow().len();
        let intents = intents.borrow_mut();
        intents.append(&intent).expect("Failed to add intent");
    });

    id
}

#[update]
pub fn add_decision(decision: Decision) {
    // TODO: Guard checking internet identity
    DECISIONS.with(|decisions| {
        let mut decisions = decisions.borrow_mut();
        let decision_list = decisions.entry(decision.intent_id).or_insert(LinkedList::new());
        decision_list.push_back(decision);
    });
}

#[query]
pub fn get_intents() -> Vec<Intent> {
    INTENTS.with(|intents| {
        let intents = intents.borrow();
        intents.iter().collect()
    })
}

#[query]
pub fn get_decisions(intent_id: u64) -> LinkedList<Decision> {
    DECISIONS.with(|decisions| {
        let decisions = decisions.borrow();
        match decisions.get(&intent_id) {
            Some(decision_list) => decision_list.clone(),
            None => LinkedList::new()
        }
    })
}

#[update]
pub async fn execute_intent(intent_id: u64) -> IntentStatus {
    let intent_option = INTENTS.with(|intents| {
        let intents = intents.borrow();
        intents.get(intent_id)
    });

    match intent_option {
        Some(intent) => {
            // Start execution
            let execution_result = super::execute(&intent).await;

            // Update the intent's status in storage
            update_intent_status(intent_id, execution_result.clone());

            execution_result
        },
        None => IntentStatus::Failed("Intent not found".to_string()),
    }
}

// Helper function to update intent status
fn update_intent_status(intent_id: u64, new_status: IntentStatus) {
    INTENTS.with(|intents| {
        let intents = intents.borrow_mut();
        let intent = intents.get(intent_id);    
        match intent {
            Some(mut intent) => {
                intent.status = new_status;
            }
            None => {
                panic!("Intent not found");
            }
        }
    });
}