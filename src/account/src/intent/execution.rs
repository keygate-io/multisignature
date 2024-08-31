use super::Intent;

pub fn should_execute(intent: &Intent) -> bool {
    let approvals = super::DECISIONS.with(|decisions| {
        let decisions = decisions.borrow();
        let decision_list = decisions.get(&intent.id());
        match decision_list {
            Some(decisions) => {
                let mut approvals = 0;
                for decision in decisions {
                    if decision.approved() {
                        approvals += 1;
                    }
                }
                approvals
            }
            None => 0,
        }
    });

    let signees = super::super::SIGNEES.with(|signees| signees.borrow().clone());
    return approvals >= signees.len();
}

pub fn execute(intent: Intent) {
    if !should_execute(&intent) {
        return;
    }

    let network = intent.network(); 
    let token = intent.token();

    super::EXECUTION_MANAGER.with(|manager| {
        let manager = manager.borrow();
        manager.execute(&intent);
    });
}

