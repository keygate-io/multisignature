#!/usr/bin/env bash
set -eEuo pipefail
SCRIPT=$(readlink -f "$0")
SCRIPT_DIR=$(dirname "$SCRIPT")
cd $SCRIPT_DIR/..

TESTNAME=${1:-}
TEST_THREADS="${TEST_THREADS:-2}"

cd test/integration

# Check if pocket-ic exists and is executable
if [[ ! -x "pocket-ic" ]]; then
    echo "PocketIC not found or not executable, downloading..."
    rm -f pocket-ic.gz pocket-ic
    curl -L https://github.com/dfinity/pocketic/releases/download/6.0.0/pocket-ic-x86_64-linux.gz -o pocket-ic.gz
    gunzip pocket-ic.gz
    chmod +x pocket-ic
    echo "PocketIC download completed"
else
    echo "PocketIC already exists, skipping download"
fi

export POCKET_IC_BIN="$(pwd)/pocket-ic"
cd ../..

cargo test --package integration $TESTNAME -- --test-threads $TEST_THREADS --nocapture