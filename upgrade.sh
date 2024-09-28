function __main(registration, account_canister) {
    // Path to the account WASM file
    let account_wasm = "./target/wasm32-unknown-unknown/debug/account.wasm";

    // Call the registration canister to load the WASM blob
    call registration.load_wallet_wasm_blob(gzip(wasm_profiling(account_wasm)));
    let load_result = _;

    // Log the result
    output("load_account_wasm.log", stringify("(registration->load_wallet_wasm_blob) Output", load_result, "\n"));

    call registration.upgrade_account(account_canister);
    let upgrade_result = _;

    output("load_account_wasm.log", stringify("(registration->upgrade_account) Output", upgrade_result, "\n"));
};