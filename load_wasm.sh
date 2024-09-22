function __main() {
    import registration = "b77ix-eeaaa-aaaaa-qaada-cai";

    // Path to the account WASM file
    let account_wasm = "./target/wasm32-unknown-unknown/debug/account.wasm";

    // Call the registration canister to load the WASM blob
    call registration.load_wallet_wasm_blob(gzip(wasm_profiling(account_wasm)));
    let load_result = _;

    // Log the result
    output("load_account_wasm.log", stringify("Load wallet WASM blob result: ", load_result, "\n"));

    // Check if loading was successful
    if (eq(load_result, null)) {
        output("load_account_wasm.log", "Successfully loaded wallet WASM blob\n");
    } else {
        output("load_account_wasm.log", stringify("Error: Failed to load wallet WASM blob: ", load_result, "\n"));
    }
};