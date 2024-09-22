#!/bin/bash
alias didc="./didc"

# Check if a WASM file is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_wasm_file>"
    exit 1
fi

WASM_FILE=$1
CANISTER_NAME="registration"

# Check if the WASM file exists
if [ ! -f "$WASM_FILE" ]; then
    echo "Error: WASM file not found: $WASM_FILE"
    exit 1
fi

# Check if didc is installed
if ! command -v didc &> /dev/null; then
    echo "didc is not installed. Installing now..."
    cargo install didc
fi

# Compress the WASM file
echo "Compressing WASM file..."
gzip -c "$WASM_FILE" > "${WASM_FILE}.gz"

# Create a temporary Candid file
echo '(blob "")' > input.did

# Encode the compressed WASM file
echo "Encoding compressed WASM file..."
didc encode -i input.did "$(cat "${WASM_FILE}.gz" | base64)" > encoded_input.did

# Call the canister function
echo "Calling load_wallet_wasm_blob on $CANISTER_NAME canister..."
dfx canister call "$CANISTER_NAME" load_wallet_wasm_blob "$(cat encoded_input.did)"

# Clean up temporary files
rm input.did encoded_input.did "${WASM_FILE}.gz"

echo "Process completed."