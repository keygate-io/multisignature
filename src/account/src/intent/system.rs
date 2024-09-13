use std::{cell::RefCell, collections::{HashMap, LinkedList}};

use candid::{CandidType, Principal};
use ic_cdk::{query, update};
use ic_ledger_types::Subaccount;
use serde::{Deserialize, Serialize};

use super::{BlockchainAdapter};


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
    id: u64,
    intent_type: IntentType,
    amount: u64,
    token: String,
    to: String,
    from: String,
    network: SupportedNetwork,
    status: IntentStatus
}

impl Intent {
    pub fn id(&self) -> u64 {
        self.id
    }

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

thread_local! {
    pub static INTENTS: RefCell<HashMap<Subaccount, LinkedList<Intent>>> = RefCell::default();
    pub static DECISIONS: RefCell<HashMap<u64, LinkedList<Decision>>> = RefCell::default();
    pub static INTENT_ID: RefCell<u64> = RefCell::new(0);
    pub static ADAPTERS: RefCell<HashMap<String, Box<dyn BlockchainAdapter>>> = RefCell::default();
}

#[query]
pub fn get_adapters() -> Vec<String> {
    ADAPTERS.with(|adapters| {
        adapters.borrow().keys().cloned().collect()
    })
}

#[update]
pub fn add_intent(subaccount: Subaccount, mut intent: Intent) -> u64 {
    let new_id = INTENT_ID.with(|id| {
        let mut id = id.borrow_mut();
        *id += 1;
        *id
    });

    intent.id = new_id;

    INTENTS.with(|intents| {
        let mut intents = intents.borrow_mut();
        let intent_list = intents.entry(subaccount).or_insert(LinkedList::new());
        intent_list.push_back(intent);
    });

    new_id
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
pub fn get_intents(subaccount: Subaccount) -> LinkedList<Intent> {
    INTENTS.with(|intents| {
        let intents = intents.borrow();
        match intents.get(&subaccount) {
            Some(intent_list) => intent_list.clone(),
            None => LinkedList::new()
        }
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
        intents.values()
            .flat_map(|list| list.iter())
            .find(|intent| intent.id() == intent_id)
            .cloned()
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
        let mut intents = intents.borrow_mut();
        for intent_list in intents.values_mut() {
            if let Some(intent) = intent_list.iter_mut().find(|i| i.id() == intent_id) {
                intent.status = new_status;
                break;
            }
        }
    });
}