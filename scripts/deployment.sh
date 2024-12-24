#!/bin/bash

BLUE='\033[1;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

CLEAN=false

while getopts "c" opt; do
  case $opt in
    c) CLEAN=true ;;
    \?) echo "Invalid option -$OPTARG" >&2 ;;
  esac
done

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

create_debug_info() {
    print_status "Creating debug information..."
    
    LEDGER_CANISTER_ID=$(dfx canister id ledger)
    ICRC1_LEDGER_CANISTER_ID=$(dfx canister id icrc1_ledger_canister)
    INTERNET_IDENTITY_CANISTER_ID=$(dfx canister id internet_identity)
    EVM_RPC_CANISTER_ID=$(dfx canister id evm_rpc)
    ACCOUNT_CANISTER_ID=$(dfx canister id account)
    CENTRAL_CANISTER_ID=$(dfx canister id central)
    DASHBOARD_CANISTER_ID=$(dfx canister id dash)
    
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

    Test Identities:
    --------------
    TEST_ACCOUNT_ID_1=$TEST_ACCOUNT_ID_1
    TEST_ACCOUNT_ID_2=$TEST_ACCOUNT_ID_2
    TEST_ACCOUNT_ID_3=$TEST_ACCOUNT_ID_3

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

clean_environment() {
    print_status "Cleaning environment..."
    dfx stop
    dfx killall
    dfx start --clean --background
    sleep 5
    print_success "Environment cleaned"
}

#!/bin/bash
setup_environment() {
    print_status "Setting up environment variables..."
    
    # Set revision constants
    REVISION="1ac5439c6da1aafe8156c667c313344c0245fea3"
    LEDGER_WASM_URL="https://download.dfinity.systems/ic/$REVISION/canisters/ledger-canister.wasm.gz"
    LEDGER_DID_URL="https://raw.githubusercontent.com/dfinity/ic/$REVISION/rs/rosetta-api/icp_ledger/ledger.did"
    
    ICRC1_REVISION="d87954601e4b22972899e9957e800406a0a6b929"
    ICRC1_WASM_URL="https://download.dfinity.systems/ic/$ICRC1_REVISION/canisters/ic-icrc1-ledger.wasm.gz"
    ICRC1_DID_URL="https://raw.githubusercontent.com/dfinity/ic/$ICRC1_REVISION/rs/rosetta-api/icrc1/ledger/ledger.did"
    
    # Create necessary directories
    mkdir -p .dfx/local/canisters/{ledger,icrc1_ledger_canister,dash,landing,internet_identity,evm_rpc}
    mkdir -p src/declarations/{ledger,icrc1_ledger_canister,internet_identity,dash,landing,evm_rpc}
    
    # Function to download with verification
    download_verify() {
        local url=$1
        local output=$2
        echo "Downloading: $url to $output"
        if ! curl -f -L -o "$output" "$url"; then
            echo "Failed to download: $url"
            return 1
        fi
        if [ ! -f "$output" ]; then
            echo "File not created: $output"
            return 1
        fi
        if [ ! -s "$output" ]; then
            echo "File is empty: $output"
            return 1
        fi
        echo "Successfully downloaded: $output"
        return 0
    }

    # Download each file with verification
    download_verify "$LEDGER_DID_URL" ".dfx/local/canisters/ledger/ledger.did" || exit 1
    download_verify "$ICRC1_DID_URL" ".dfx/local/canisters/icrc1_ledger_canister/ledger.did" || exit 1
    download_verify "https://raw.githubusercontent.com/jamesbeadle/OpenFPL/4ae9346d84233654a6856b8d05defa4df8a66346/candid/assetstorage.did" ".dfx/local/canisters/dash/assetstorage.did" || exit 1
    download_verify "https://raw.githubusercontent.com/jamesbeadle/OpenFPL/4ae9346d84233654a6856b8d05defa4df8a66346/candid/assetstorage.did" ".dfx/local/canisters/landing/assetstorage.did" || exit 1
    download_verify "$ICRC1_DID_URL" ".dfx/local/canisters/icrc1_ledger_canister/icrc1_ledger_canister.did" || exit 1
    download_verify "https://raw.githubusercontent.com/dfinity/internet-identity/main/src/internet_identity/internet_identity.did" ".dfx/local/canisters/internet_identity/internet_identity.did" || exit 1
    download_verify "https://github.com/internet-computer-protocol/evm-rpc-canister/releases/latest/download/evm_rpc.did" ".dfx/local/canisters/evm_rpc/evm_rpc.did" || exit 1

    # Verify and copy files
    for dir in ledger icrc1_ledger_canister internet_identity dash landing evm_rpc; do
        src_file=".dfx/local/canisters/$dir/"*".did"
        dst_dir="src/declarations/$dir/"
        echo "Copying from $src_file to $dst_dir"
        if ! cp $src_file "$dst_dir"; then
            echo "Failed to copy DID file for $dir"
            exit 1
        fi
    done

    print_success "Environment variables set and files downloaded"
}

check_dfx_status() {
    print_status "Checking DFX status..."
    
    if ! curl -s -X GET "http://127.0.0.1:4943/api/v2/status" > /dev/null; then
        print_status "DFX is not running properly. Attempting restart..."
        dfx stop
        dfx killall
        dfx start --background
        sleep 5
        
        if ! curl -s -X GET "http://127.0.0.1:4943/api/v2/status" > /dev/null; then
            print_error "Failed to start DFX properly"
        fi
        print_success "DFX restarted successfully"
    else
        print_success "DFX is running properly"
    fi
}

create_canisters() {
    print_status "Creating canisters..."
    
    dfx canister create ledger --specified-id ryjl3-tyaaa-aaaaa-aaaba-cai || print_error "Failed to create ledger canister"
    dfx canister create icrc1_ledger_canister || print_error "Failed to create ICRC1 ledger canister"
    dfx canister create evm_rpc --specified-id 7hfb6-caaaa-aaaar-qadga-cai || print_status "EVM RPC canister already exists"
    local canisters=("internet_identity" "dash" "central" "account" "landing")
    for canister in "${canisters[@]}"; do
        dfx canister create "$canister" || print_status "Canister $canister already exists"
    done
    
    print_success "Canisters created successfully"
}

setup_identities() {
    print_status "Setting up identities..."

    dfx identity use default
    export DEFAULT_PRINCIPAL=$(dfx identity get-principal)
    
    dfx identity new minter --force || print_status "Minter identity already exists"
    dfx identity use minter
    export MINT_ACC=$(dfx identity get-principal)
    export ACCOUNT_ID=$(dfx ledger account-id)
    dfx identity get-principal
    
    for i in {1..3}; do
        dfx identity new "test_identity_$i" --force || print_status "Test identity $i already exists"
        dfx identity use "test_identity_$i"
        export TEST_ACCOUNT_ID_$i=$(dfx ledger account-id)
    done
    
    dfx identity use default
    export LEDGER_ACC=$(dfx identity get-principal)
    export ARCHIVE_CONTROLLER=$(dfx identity get-principal)
    
    print_success "Identities configured"
}

build_all_canisters() {
    print_status "Building all canisters..."
    
    dfx generate || print_status "Generate step completed with warnings"
    
    local canisters=("ledger" "icrc1_ledger_canister" "internet_identity" "evm_rpc" "dash" "account" "central" "landing")
    for canister in "${canisters[@]}"; do
        print_status "Building $canister..."
        dfx build "$canister" || print_error "Failed to build $canister"
        print_success "$canister built successfully"
    done
}

deploy_ledger_canisters() {
    print_status "Deploying ledger canisters..."
    
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
        }
    })" || print_error "Failed to deploy ICP ledger"

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
    }})" || print_error "Failed to deploy ICRC1 ledger"

    print_success "Ledger canisters deployed successfully"
}

deploy_core_canisters() {
    print_status "Deploying core canisters..."
    
    # First install internet_identity since it doesn't need special init args
    print_status "Deploying internet_identity..."
    dfx deploy "internet_identity" || print_error "Failed to deploy internet_identity"
    print_success "internet_identity deployed successfully"
    
    # Install account with the new initialization arguments
    print_status "Installing account canister..."
    dfx canister install account --argument "(record { 
        name = \"Primary Vault\";
        signers = vec { principal \"$DEFAULT_PRINCIPAL\" };
    })" || print_error "Failed to install account canister"
    print_success "account canister installed successfully"
    
    # Finally deploy central
    print_status "Deploying central..."
    dfx deploy "central" || print_error "Failed to deploy central"
    print_status "Depositing cycles to central..."
    dfx canister deposit-cycles 29T central
    print_success "central deployed successfully"
}

deploy_frontend_canisters() {
    print_status "Deploying frontend canisters..."
    
    local canisters=("dash" "landing")
    for canister in "${canisters[@]}"; do
        print_status "Deploying $canister..."
        dfx deploy "$canister" || print_error "Failed to deploy $canister"
        print_success "$canister deployed successfully"
    done

    print_status "Deploying EVM RPC..."
    dfx deploy evm_rpc --argument "(record { nodesInSubnet = 28 })" --yes || print_error "Failed to deploy EVM RPC"
    print_success "EVM RPC deployed successfully"
}

main() {
    print_status "Starting deployment process..."
    if $CLEAN; then
        clean_environment
    else
        check_dfx_status
    fi
    
    setup_environment
    create_canisters
    setup_identities
    setup_environment
    build_all_canisters
    deploy_ledger_canisters
    deploy_core_canisters
    deploy_frontend_canisters
    create_debug_info
    
    print_success "Deployment completed successfully!"
    print_status "Dashboard is available at: http://${DASHBOARD_CANISTER_ID}.localhost:4943/"
}

main