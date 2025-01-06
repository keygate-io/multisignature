#!/bin/bash

# Input params
address=$1 
amount=$2

# Validation
if [ -z "$address" ] || [ -z "$amount" ]; then
 echo "Usage: fund-icp.sh <address> <amount>"
 exit 1
fi

# Save current identity
initial_identity=$(dfx identity whoami)

# Switch to minter identity
dfx identity use minter

# Transfer with zero memo (standard)
dfx ledger transfer \
 --memo 0 \
 --amount $amount \
 --fee 0 \
 $address \
 --network local

exit_code=$?

if [ $exit_code -eq 0 ]; then
 echo "Funded $address with $amount ICP"
else
 echo "Transfer failed with code $exit_code"
fi

# Switch back to initial identity
dfx identity use "$initial_identity"

exit $exit_code