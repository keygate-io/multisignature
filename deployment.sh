#!/bin/bash

# Step 3: Determine ledger file locations
REVISION="1ac5439c6da1aafe8156c667c313344c0245fea3"
LEDGER_WASM_URL="https://download.dfinity.systems/ic/$REVISION/canisters/ledger-canister.wasm.gz"
LEDGER_DID_URL="https://raw.githubusercontent.com/dfinity/ic/$REVISION/rs/rosetta-api/icp_ledger/ledger.did"

# ICRC-1 Ledger canister URLs
ICRC1_REVISION="d87954601e4b22972899e9957e800406a0a6b929"
ICRC1_WASM_URL="https://download.dfinity.systems/ic/$ICRC1_REVISION/canisters/ic-icrc1-ledger.wasm.gz"
ICRC1_DID_URL="https://raw.githubusercontent.com/dfinity/ic/$ICRC1_REVISION/rs/rosetta-api/icrc1/ledger/ledger.did"

dfx stop

# Step 5: Start a local replica
dfx start --background --clean

dfx identity use default
export DEFAULT_PRINCIPAL=$(dfx identity get-principal)

# Step 6: Create a new identity that will work as a minting account
dfx identity new minter
dfx identity use minter
export MINT_ACC=$(dfx identity get-principal)
export ACCOUNT_ID=$(dfx ledger account-id)
dfx identity get-principal

# Create three additional identities for testing
for i in {1..3}
do
    dfx identity new test_identity_$i
    dfx identity use test_identity_$i
    export TEST_ACCOUNT_ID_$i=$(dfx ledger account-id)
done

# Step 7: Switch back to your default identity and record its ledger account identifier
dfx identity use default  
export LEDGER_ACC=$(dfx identity get-principal)

# Step 8: Obtain the principal of the identity you use for development
export ARCHIVE_CONTROLLER=$(dfx identity get-principal)

# Step 9: Deploy the ICP ledger canister with archiving options
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

# Step 10: Deploy the ICRC-1 ledger canister
dfx canister create icrc1_ledger_canister
dfx build icrc1_ledger_canister
dfx canister install icrc1_ledger_canister --argument "(variant { Init = record {
  token_symbol = \"MCK\";
  token_name = \"Mock Token\";
  minting_account = record { owner = principal \"$LEDGER_ACC\"; subaccount = null };
  transfer_fee = 1_000_000 : nat;
  metadata = vec {};
  initial_balances = vec { 
    record { record { owner = principal \"$LEDGER_ACC\"; subaccount = null }; 100_000_000_000 : nat };
    record { record { owner = principal \"$DEFAULT_PRINCIPAL\"; subaccount = null }; 1_000_000_000_000 : nat };
  };
  archive_options = record {
    num_blocks_to_archive = 10 : nat64;
    trigger_threshold = 5 : nat64;
    controller_id = principal \"$ARCHIVE_CONTROLLER\";
  };
  feature_flags = null;
}})"

# Step 11: Deploy the remaining canisters
deploy_output=$(dfx deploy 2>&1)

if echo "$deploy_output" | grep -q "Deployed canisters"; then
  echo "You can now interact with the ledger canisters using CLI commands or the Candid UI."
else
  echo "$deploy_output"
  echo "Deployment failed. Please check the error messages above."
fi

# Capture canister IDs
LEDGER_CANISTER_ID=$(dfx canister id ledger)
ICRC1_LEDGER_CANISTER_ID=$(dfx canister id icrc1_ledger_canister)
DASHBOARD_CANISTER_ID=$(dfx canister id dash)
ACCOUNT_CANISTER_ID=$(dfx canister id account)
REGISTRATION_CANISTER_ID=$(dfx canister id registration)
INTERNET_IDENTITY_CANISTER_ID=$(dfx canister id internet_identity)

# Extract URLs from deploy output
FRONTEND_URLS=$(echo "$deploy_output" | grep -A 4 "Frontend canister via browser" | grep "http" | sed 's/^[[:space:]]*//')
BACKEND_URLS=$(echo "$deploy_output" | grep -A 6 "Backend canister via Candid interface:" | grep "http" | sed 's/^[[:space:]]*//')

# Create .debug file with exported variables, canister IDs, and URLs
cat << EOF > .debug
Exported variables:
REVISION=$REVISION
LEDGER_WASM_URL=$LEDGER_WASM_URL
LEDGER_DID_URL=$LEDGER_DID_URL
ICRC1_REVISION=$ICRC1_REVISION
ICRC1_WASM_URL=$ICRC1_WASM_URL
ICRC1_DID_URL=$ICRC1_DID_URL
MINT_ACC=$MINT_ACC
ACCOUNT_ID=$ACCOUNT_ID 
LEDGER_ACC=$LEDGER_ACC
ARCHIVE_CONTROLLER=$ARCHIVE_CONTROLLER

Test Identities Account IDs:
TEST_ACCOUNT_ID_1=$TEST_ACCOUNT_ID_1
TEST_ACCOUNT_ID_2=$TEST_ACCOUNT_ID_2
TEST_ACCOUNT_ID_3=$TEST_ACCOUNT_ID_3

Canister Principal IDs:
LEDGER_CANISTER_ID=$LEDGER_CANISTER_ID
ICRC1_LEDGER_CANISTER_ID=$ICRC1_LEDGER_CANISTER_ID
DASHBOARD_CANISTER_ID=$DASHBOARD_CANISTER_ID
ACCOUNT_CANISTER_ID=$ACCOUNT_CANISTER_ID
REGISTRATION_CANISTER_ID=$REGISTRATION_CANISTER_ID
INTERNET_IDENTITY_CANISTER_ID=$INTERNET_IDENTITY_CANISTER_ID
DEFAULT_PRINCIPAL=$DEFAULT_PRINCIPAL

Frontend URLs:
$FRONTEND_URLS

Backend URLs:
$BACKEND_URLS
EOF

echo "Debug information has been written to .debug file"