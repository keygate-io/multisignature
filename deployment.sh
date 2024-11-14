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

# Step 1: Environment setup
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

# Step 3: Create Canisters
create_canisters() {
    print_status "Creating canisters..."
    
    # Create Internet Identity canister
    dfx canister create internet_identity || {
        print_error "Failed to create Internet Identity canister"
    }

    # Create dashboard canister
    dfx canister create dash || {
        print_error "Failed to create dashboard canister"
    }

    # Create central canister
    dfx canister create central || {
        print_error "Failed to create central canister"
    }
    
    # Create account canister
    dfx canister create account || {
        print_error "Failed to create account canister"
    }
    
    print_success "Canisters created successfully"

    mkdir -p .dfx/local/canisters/dash && \
    curl -o .dfx/local/canisters/dash/assetstorage.did https://raw.githubusercontent.com/jamesbeadle/OpenFPL/4ae9346d84233654a6856b8d05defa4df8a66346/candid/assetstorage.did
}

# Step 4: Identity management
setup_identities() {
    print_status "Setting up identities..."

    dfx identity use default
    export DEFAULT_PRINCIPAL=$(dfx identity get-principal)
    
    # Create and configure minter identity
    dfx identity new minter --force || print_error "Failed to create minter identity"
    dfx identity use minter
    export MINT_ACC=$(dfx identity get-principal)
    export ACCOUNT_ID=$(dfx ledger account-id)
    dfx identity get-principal
    
    # Switch back to default identity
    dfx identity use default
    export LEDGER_ACC=$(dfx identity get-principal)
    export ARCHIVE_CONTROLLER=$(dfx identity get-principal)
    
    
    print_success "Identities configured"
}

# Step 5: Deploy the remaining canisters in the specified order
deploy_canisters() {
    local canisters=("internet_identity" "landing" "ledger" "icrc1_ledger_canister" "dash" "account" "central")
    for canister in "${canisters[@]}"; do
        echo "Deploying $canister..."
        deploy_output=$(dfx deploy "$canister" 2>&1)
        if echo "$deploy_output" | grep -q "Deployed canisters"; then
            echo "$canister deployed successfully."
        else
            echo "$deploy_output"
            echo "Deployment of $canister failed. Please check the error messages above."
            return 1
        fi
    done
}

# Step 6: EVM RPC deployment
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


# Step 7: Create debug information
create_debug_info() {
    print_status "Creating debug information..."
    
    # Capture canister IDs
    LEDGER_CANISTER_ID=$(dfx canister id ledger)
    ICRC1_LEDGER_CANISTER_ID=$(dfx canister id icrc1_ledger_canister)
    INTERNET_IDENTITY_CANISTER_ID=$(dfx canister id internet_identity)
    EVM_RPC_CANISTER_ID=$(dfx canister id evm_rpc)
    ACCOUNT_CANISTER_ID=$(dfx canister id account)
    CENTRAL_CANISTER_ID=$(dfx canister id central)
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
    ACCOUNT_CANISTER_ID=$ACCOUNT_CANISTER_ID
    CENTRAL_CANISTER_ID=$CENTRAL_CANISTER_ID
    DASHBOARD_CANISTER_ID=$DASHBOARD_CANISTER_ID

    Frontend URLs:
    ------------
    Internet Identity URL: http://${INTERNET_IDENTITY_CANISTER_ID}.localhost:4943/
    EVM RPC URL: http://${EVM_RPC_CANISTER_ID}.localhost:4943/
    Dashboard URL: http://${DASHBOARD_CANISTER_ID}.localhost:4943/
EOF
        
    print_success "Debug information written to .debug file"
}

# Main execution
main() {
    print_status "Starting deployment process..."
    
    check_dfx_status
    setup_environment
    create_canisters
    setup_identities
    deploy_canisters
    deploy_evm_rpc
    create_debug_info
    
    print_success "Deployment completed successfully!"
    print_status "Dashboard is available at: http://${DASHBOARD_CANISTER_ID}.localhost:4943/"
}

# Execute main function
main