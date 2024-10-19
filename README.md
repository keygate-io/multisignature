# multisignature
A cross-chain decentralized multisignature wallet.

## Prerequisites
* [Tsc compiler](https://www.typescriptlang.org/download/) 
* [Rust (using rustup)](https://www.rust-lang.org/tools/install)
* [DFX command-line tool](https://internetcomputer.org/docs/current/developer-docs/getting-started/install/#installing-dfx-via-dfxvm)

## Installation
1. Clone the repository:
   ```
   git clone git@github.com:keygate-vault/multisignature.git
   ```
2. Install frontend dependencies via NPM:
   ```
   npm install
   ```
3. Run the deployment script:
   ```
   ./deployment.sh
   ```

## Architecture
<img width="804" alt="image" src="https://github.com/user-attachments/assets/66a939de-133a-4c2f-a1d8-290101df6c80">

**Ledger canister**: Imported from the existing DFINITY native ICP ledger through `dfx.json`. Used to fetch the ICP balance of a smart account.

**Dashboard canister** (`dash`): Provides the user interface for interacting with the multisignature wallet.

**Account canister**: Manages the multisignature wallet functionality, including transaction creation, approval, and execution.

## Logic
```mermaid
sequenceDiagram
    participant User
    participant INTENTS
    participant DECISIONS
    participant ADAPTERS
    participant ICPNativeTransferAdapter

    User->>+INTENTS: add_intent(intent)
    INTENTS->>INTENTS: Store intent
    INTENTS-->>-User: Return intent_id

    User->>+DECISIONS: add_decision(decision)
    DECISIONS->>DECISIONS: Store decision
    DECISIONS-->>-User: Decision added

    User->>+INTENTS: execute_intent(intent_id)
    INTENTS->>INTENTS: Get intent
    INTENTS->>DECISIONS: get_decisions(intent_id)
    DECISIONS-->>INTENTS: Return decisions

    alt Enough approvals
        INTENTS->>+ADAPTERS: Get appropriate adapter
        ADAPTERS-->>-INTENTS: Return adapter (e.g., ICPNativeTransferAdapter)
        INTENTS->>+ICPNativeTransferAdapter: execute(intent)
        ICPNativeTransferAdapter->>ICPNativeTransferAdapter: Prepare transfer args
        ICPNativeTransferAdapter->>ICPNativeTransferAdapter: transfer()
        ICPNativeTransferAdapter-->>-INTENTS: Return IntentStatus
        INTENTS->>INTENTS: update_intent_status(intent_id, new_status)
    else Not enough approvals
        INTENTS-->>User: Return IntentStatus::Failed
    end

    INTENTS-->>-User: Return final IntentStatus
```

## Useful commands

Send ICRC1 tokens to a vault.
```
dfx canister call icrc1_ledger_canister icrc1_transfer '(
  record {
    from_subaccount = null;
    to = record {
      owner = principal "avqkn-guaaa-aaaaa-qaaea-cai"
    };
    amount = 200_000_000_000;
    fee = opt 0;        
    memo = null;
    created_at_time = null;
  }
)'
```

Request ICRC1 balance of a principal.
```
dfx canister call icrc1_ledger_canister icrc1_balance_of '(
  record {
    owner = principal "avqkn-guaaa-aaaaa-qaaea-cai";
    subaccount = null;
  }
)'
```

