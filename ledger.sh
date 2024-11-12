#!/bin/bash

# Step 3: Determine ledger file locations
REVISION="1ac5439c6da1aafe8156c667c313344c0245fea3"
LEDGER_WASM_URL="https://download.dfinity.systems/ic/$REVISION/canisters/ledger-canister.wasm.gz"
LEDGER_DID_URL="https://raw.githubusercontent.com/dfinity/ic/$REVISION/rs/rosetta-api/icp_ledger/ledger.did"

# ICRC-1 Ledger canister URLs (Optional, can be removed if only deploying the ICP ledger)
ICRC1_REVISION="d87954601e4b22972899e9957e800406a0a6b929"
ICRC1_WASM_URL="https://download.dfinity.systems/ic/$ICRC1_REVISION/canisters/ic-icrc1-ledger.wasm.gz"
ICRC1_DID_URL="https://raw.githubusercontent.com/dfinity/ic/$ICRC1_REVISION/rs/rosetta-api/icrc1/ledger/ledger.did"

# Stop any running dfx instance
dfx stop
dfx killall

# Start a local replica
dfx start --background --clean

# Use default identity for minting and deployment
dfx identity use default
export DEFAULT_PRINCIPAL=$(dfx identity get-principal)

# Create a new identity to serve as the minting account
dfx identity new minter
dfx identity use minter
export MINT_ACC=$(dfx identity get-principal)
export ACCOUNT_ID=$(dfx ledger account-id)
dfx identity use default  # Switch back to default identity for further setup
export LEDGER_ACC=$(dfx identity get-principal)
export ARCHIVE_CONTROLLER=$(dfx identity get-principal)

# Step 9: Deploy the ICP ledger canister with initialization arguments
dfx canister create ledger --specified-id ryjl3-tyaaa-aaaaa-aaaba-cai
dfx build ledger
dfx canister install ledger --argument "(variant {
  Init = record {
    minting_account = \"$ACCOUNT_ID\";
    icrc1_minting_account = opt record {
      owner = principal \"$MINT_ACC\";
      subaccount = null;
    };
    initial_values = vec {
      record {
        \"$ACCOUNT_ID\";
        record {
          e8s = 100000000 : nat64;
        };
      };
    };
    max_message_size_bytes = opt(2560000 : nat64);
    transaction_window = opt record {
      secs = 10 : nat64;
      nanos = 0 : nat32;
    };
    archive_options = opt record {
      trigger_threshold = 1000000 : nat64;
      num_blocks_to_archive = 1000000 : nat64;
      node_max_memory_size_bytes = null;
      max_message_size_bytes = null;
      controller_id = principal \"$ARCHIVE_CONTROLLER\";
      cycles_for_archive_creation = null;
    };
    send_whitelist = vec {
      principal \"$LEDGER_ACC\";
    };
    transfer_fee = opt record {
      e8s = 1000000 : nat64;
    };
    token_symbol = opt \"SYB\";
    token_name = opt \"NAME\";
  }})";

# Capture the deployed ledger canister ID
LEDGER_CANISTER_ID=$(dfx canister id ledger)

# Write basic debug information to .debug file
cat << EOF > .debug
Ledger Setup Debug Information:
-------------------------------
Revision: $REVISION
Ledger Wasm URL: $LEDGER_WASM_URL
Ledger DID URL: $LEDGER_DID_URL

Minting Account Principal: $MINT_ACC
Account ID: $ACCOUNT_ID 
Ledger Principal ID: $LEDGER_ACC
Archive Controller ID: $ARCHIVE_CONTROLLER
Ledger Canister ID: $LEDGER_CANISTER_ID
EOF

echo "Ledger deployed successfully. Debug information has been written to .debug file."
