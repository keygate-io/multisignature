function __main(central, account_canister) {
    identity default;
    // Path to the account WASM file
    let account_wasm = "./target/wasm32-unknown-unknown/debug/account.wasm";

    // Call the central canister to load the WASM blob
    call central.load_wallet_wasm_blob(gzip(wasm_profiling(account_wasm)));
    let load_result = _;

    // Log the result
    output("load_account_wasm.log", stringify("(central->load_wallet_wasm_blob) Output", load_result, "\n"));

    call central.upgrade_account(account_canister);
    let upgrade_result = _;

    output("load_account_wasm.log", stringify("(central->upgrade_account) Output", upgrade_result, "\n"));
};