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

# Set max retries and delay between retries
max_retries=3
retry_delay=5

# Try transfer with retries
for ((i=1; i<=$max_retries; i++)); do
 # Transfer with zero memo (standard)
 dfx ledger transfer --memo 0 --amount $amount --fee 0 $address --network local
 exit_code=$?

 if [ $exit_code -eq 0 ]; then
  echo "Funded $address with $amount ICP"
  break
 else
  echo "Transfer attempt $i failed with code $exit_code"
  if [ $i -lt $max_retries ]; then
   echo "Retrying in $retry_delay seconds..."
   sleep $retry_delay
  fi
 fi
done

# Switch back to initial identity
dfx identity use "$initial_identity"

exit $exit_code