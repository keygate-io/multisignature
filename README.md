# multisignature
A cross-chain decentralized multisignature wallet.

## Prerequisites
* [Tsc compiler](https://www.typescriptlang.org/download/) 
* [Rust (using rustup)](https://www.rust-lang.org/tools/install)
* [DFX command-line tool](https://internetcomputer.org/docs/current/developer-docs/getting-started/install/#installing-dfx-via-dfxvm)

## Installation
Clone the repository.

`git clone git@github.com:polysign-labs/multisignature.git`

Install frontend dependencies via NPM

`npm install`

Run the deployment script.

`./deployment.sh`

## Canisters
- Ledger canister
This canister is imported from the existing DFINITY native ICP ledger through `dfx.json`.

Purposes:
* Getting the ICP balance of a smart account via the code equivalent of `dfx ledger balance <account_id> --network local`

- Dashboard canister (`dash`)
- Account canister
