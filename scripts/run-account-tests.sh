#!/usr/bin/env bash
set -eEuo pipefail
SCRIPT=$(readlink -f "$0")
SCRIPT_DIR=$(dirname "$SCRIPT")
cd $SCRIPT_DIR/..

TESTNAME=${1:-}
TEST_THREADS="${TEST_THREADS:-2}"

cd test/integration
rm -f pocket-ic.gz pocket-ic
echo "PocketIC download starting"
curl -L https://github.com/dfinity/pocketic/releases/download/6.0.0/pocket-ic-x86_64-darwin.gz -o pocket-ic.gz
gunzip pocket-ic.gz
chmod +x pocket-ic
export POCKET_IC_BIN="$(pwd)/pocket-ic"
echo "PocketIC download completed"
cd ../..

cargo test --package account $TESTNAME -- --test-threads $TEST_THREADS --nocapture