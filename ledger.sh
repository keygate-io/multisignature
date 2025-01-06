#!/bin/bash

print_status() {
    echo -e "\033[1;34m>>> $1\033[0m"
}

# Create minter identity
print_status "Creating minter identity..."
dfx identity new minter --force
dfx identity use minter
export MINT_ACC=$(dfx identity get-principal)
export ACCOUNT_ID=$(dfx ledger account-id)

# Switch back to default
dfx identity use default
export LEDGER_ACC=$(dfx identity get-principal)
export ARCHIVE_CONTROLLER=$(dfx identity get-principal)

print_status "Deploying ledger..."
dfx canister create ledger --specified-id ryjl3-tyaaa-aaaaa-aaaba-cai
dfx build ledger

# Install with initialization arguments
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
      e8s = 10000 : nat64;
    };
    token_symbol = opt \"SYB\";
    token_name = opt \"NAME\";
  }})" --mode=reinstall

print_status "Done! Ledger has been deployed."
