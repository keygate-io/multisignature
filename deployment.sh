#!/bin/bash

# Colors for status messages
BLUE='\033[1;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Utility functions
print_status() {
    echo -e "${BLUE}>>> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

# Step 2: Check API status and restart if needed
check_dfx_status() {
    print_status "Checking DFX status..."
    
    if ! curl -s -X GET "http://127.0.0.1:4943/api/v2/status" > /dev/null; then
        print_status "DFX is not running properly. Attempting restart..."
        
        print_status "Stopping DFX..."
        dfx stop
        
        print_status "Killing all DFX processes..."
        dfx killall
        
        print_status "Starting DFX..."
        dfx start --background
        
        # Wait for DFX to start
        sleep 5
        
        # Verify DFX is now running
        if ! curl -s -X GET "http://127.0.0.1:4943/api/v2/status" > /dev/null; then
            print_error "Failed to start DFX properly"
        fi
        
        print_success "DFX restarted successfully"
    else
        print_success "DFX is running properly"
    fi
}

# Step 3: Environment setup
setup_environment() {
    print_status "Setting up environment variables..."
    
    # Ledger configuration
    REVISION="1ac5439c6da1aafe8156c667c313344c0245fea3"
    LEDGER_WASM_URL="https://download.dfinity.systems/ic/$REVISION/canisters/ledger-canister.wasm.gz"
    LEDGER_DID_URL="https://raw.githubusercontent.com/dfinity/ic/$REVISION/rs/rosetta-api/icp_ledger/ledger.did"
    
    # ICRC1 configuration
    ICRC1_REVISION="d87954601e4b22972899e9957e800406a0a6b929"
    ICRC1_WASM_URL="https://download.dfinity.systems/ic/$ICRC1_REVISION/canisters/ic-icrc1-ledger.wasm.gz"
    ICRC1_DID_URL="https://raw.githubusercontent.com/dfinity/ic/$ICRC1_REVISION/rs/rosetta-api/icrc1/ledger/ledger.did"
    
    print_success "Environment variables set"
}

# Step 4: Internet Identity deployment
deploy_internet_identity() {
    print_status "Deploying Internet Identity canister..."
    
    # Create and build Internet Identity canister
    dfx canister create internet_identity || {
        print_error "Failed to create Internet Identity canister"
    }
    
    dfx build internet_identity || {
        print_error "Failed to build Internet Identity canister"
    }
    
    # Install Internet Identity canister with --yes flag
    dfx canister install internet_identity --mode=reinstall --yes || {
        print_error "Failed to install Internet Identity canister"
    }
    
    print_success "Internet Identity deployed successfully"
}

# Step 5: Identity management
setup_identities() {
    print_status "Setting up identities..."
    
    # Create and configure minter identity
    dfx identity new minter --force || print_error "Failed to create minter identity"
    dfx identity use minter
    export MINT_ACC=$(dfx identity get-principal)
    export ACCOUNT_ID=$(dfx ledger account-id)
    
    # Switch back to default identity
    dfx identity use default
    export LEDGER_ACC=$(dfx identity get-principal)
    export ARCHIVE_CONTROLLER=$(dfx identity get-principal)
    export DEFAULT_PRINCIPAL=$(dfx identity get-principal)
    
    print_success "Identities configured"
}

# Step 6: Ledger deployment
deploy_ledger() {
    print_status "Deploying ledger canister..."
    
    # Create and build ledger canister
    dfx canister create ledger --specified-id ryjl3-tyaaa-aaaaa-aaaba-cai || {
        print_error "Failed to create ledger canister"
    }
    
    dfx build ledger || {
        print_error "Failed to build ledger canister"
    }
    
    # Install ledger with initialization arguments and --yes flag
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
        }})" --mode=reinstall --yes || {
            print_error "Failed to install ledger canister"
        }
    
    print_success "Ledger deployed successfully"
}

# Step 7: ICRC1 Ledger deployment
deploy_icrc1_ledger() {
    print_status "Deploying ICRC1 ledger canister..."
    
    # Create and build ICRC1 ledger canister
    dfx canister create icrc1_ledger_canister || {
        print_error "Failed to create ICRC1 ledger canister"
    }
    
    dfx build icrc1_ledger_canister || {
        print_error "Failed to build ICRC1 ledger canister"
    }
    
    # Install ICRC1 ledger with initialization arguments and --yes flag
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
    }})" --mode=reinstall --yes || {
        print_error "Failed to install ICRC1 ledger canister"
    }
    
    print_success "ICRC1 Ledger deployed successfully"
}

# Step 8: EVM RPC deployment
deploy_evm_rpc() {
    print_status "Deploying EVM RPC canister..."
    
    # Create EVM RPC canister with specified ID
    dfx canister create evm_rpc --specified-id 7hfb6-caaaa-aaaar-qadga-cai || {
        print_error "Failed to create EVM RPC canister"
    }

    # Deploy the EVM RPC canister with initialization argument and --yes flag
    dfx deploy evm_rpc --argument "(record { nodesInSubnet = 28 })" --yes || {
        print_error "Failed to deploy EVM RPC canister"
    }
    
    print_success "EVM RPC deployed successfully"
}

# Step 9: Landing deployment
deploy_landing() {
    print_status "Deploying landing canister..."
    
    # Create landing canister
    dfx canister create landing || {
        print_error "Failed to create landing canister"
    }

    # Deploy the landing canister with --yes flag
    dfx deploy landing --yes || {
        print_error "Failed to deploy landing canister"
    }
    
    print_success "Landing deployed successfully"
}

# Step 10: Dashboard deployment
deploy_dashboard() {
    print_status "Deploying dashboard canister..."
    
    # Create dashboard canister
    dfx canister create dash || {
        print_error "Failed to create dashboard canister"
    }

    # Deploy the dashboard canister with --yes flag
    dfx deploy dash --yes || {
        print_error "Failed to deploy dashboard canister"
    }
    
    print_success "Dashboard deployed successfully"
}

# Step 11: Create debug information
create_debug_info() {
    print_status "Creating debug information..."
    
    # Capture canister IDs
    LEDGER_CANISTER_ID=$(dfx canister id ledger)
    ICRC1_LEDGER_CANISTER_ID=$(dfx canister id icrc1_ledger_canister)
    INTERNET_IDENTITY_CANISTER_ID=$(dfx canister id internet_identity)
    EVM_RPC_CANISTER_ID=$(dfx canister id evm_rpc)
    LANDING_CANISTER_ID=$(dfx canister id landing)
    DASHBOARD_CANISTER_ID=$(dfx canister id dash)
    
    # Create .debug file
    cat << EOF > .debug
Deployment Information:
----------------------
REVISION=$REVISION
LEDGER_WASM_URL=$LEDGER_WASM_URL
LEDGER_DID_URL=$LEDGER_DID_URL
ICRC1_REVISION=$ICRC1_REVISION
ICRC1_WASM_URL=$ICRC1_WASM_URL
ICRC1_DID_URL=$ICRC1_DID_URL

Identity Information:
-------------------
MINT_ACC=$MINT_ACC
ACCOUNT_ID=$ACCOUNT_ID
LEDGER_ACC=$LEDGER_ACC
ARCHIVE_CONTROLLER=$ARCHIVE_CONTROLLER
DEFAULT_PRINCIPAL=$DEFAULT_PRINCIPAL

Canister Information:
-------------------
LEDGER_CANISTER_ID=$LEDGER_CANISTER_ID
ICRC1_LEDGER_CANISTER_ID=$ICRC1_LEDGER_CANISTER_ID
INTERNET_IDENTITY_CANISTER_ID=$INTERNET_IDENTITY_CANISTER_ID
EVM_RPC_CANISTER_ID=$EVM_RPC_CANISTER_ID
LANDING_CANISTER_ID=$LANDING_CANISTER_ID
DASHBOARD_CANISTER_ID=$DASHBOARD_CANISTER_ID

Frontend URLs:
------------
Internet Identity URL: http://${INTERNET_IDENTITY_CANISTER_ID}.localhost:4943/
EVM RPC URL: http://${EVM_RPC_CANISTER_ID}.localhost:4943/
Landing URL: http://${LANDING_CANISTER_ID}.localhost:4943/
Dashboard URL: http://${DASHBOARD_CANISTER_ID}.localhost:4943/
EOF
    
    print_success "Debug information written to .debug file"
}

# Main execution
main() {
    print_status "Starting deployment process..."
    
    check_dfx_status
    setup_environment
    setup_identities
    deploy_internet_identity
    deploy_ledger
    deploy_icrc1_ledger
    deploy_evm_rpc
    deploy_landing
    deploy_dashboard
    create_debug_info
    
    print_success "Deployment completed successfully!"
    print_status "Landing is available at: http://${LANDING_CANISTER_ID}.localhost:4943/"
    print_status "Dashboard is available at: http://${DASHBOARD_CANISTER_ID}.localhost:4943/"
}

# Execute main function
main