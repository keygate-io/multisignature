#!/bin/bash

# Step 3: Determine ledger file locations
REVISION="1ac5439c6da1aafe8156c667c313344c0245fea3"
LEDGER_WASM_URL="https://download.dfinity.systems/ic/$REVISION/canisters/ledger-canister.wasm.gz"
LEDGER_DID_URL="https://raw.githubusercontent.com/dfinity/ic/$REVISION/rs/rosetta-api/icp_ledger/ledger.did"

dfx stop

# Step 5: Start a local replica
dfx start --background --clean

# Step 6: Create a new identity that will work as a minting account
dfx identity new minter
dfx identity use minter
export MINT_ACC=$(dfx identity get-principal)
dfx identity get-principal

echo "Navigate to https://icscan.io/principal/$MINT_ACC and copy the 'Accounts' value"
read -p "Paste the 'Accounts' value: " ACCOUNT_ID
export ACCOUNT_ID

# Step 7: Switch back to your default identity and record its ledger account identifier
dfx identity use default  
export LEDGER_ACC=$(dfx identity get-principal)

# Step 8: Obtain the principal of the identity you use for development
export ARCHIVE_CONTROLLER=$(dfx identity get-principal)

# Step 9: Deploy the ledger canister with archiving options
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

# Step 10: Deploy the canister
deploy_output=$(dfx deploy 2>&1)

if echo "$deploy_output" | grep -q "Deployed canisters"; then
  echo "You can now interact with the ledger canister using CLI commands or the Candid UI."
else
  echo "Deployment failed. Please check the error messages above."
fi

echo "Exported variables:"
echo "REVISION=$REVISION"
echo "LEDGER_WASM_URL=$LEDGER_WASM_URL"
echo "LEDGER_DID_URL=$LEDGER_DID_URL"
echo "MINT_ACC=$MINT_ACC"
echo "ACCOUNT_ID=$ACCOUNT_ID" 
echo "LEDGER_ACC=$LEDGER_ACC"
echo "ARCHIVE_CONTROLLER=$ARCHIVE_CONTROLLER"