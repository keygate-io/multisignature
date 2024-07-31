use ic_cdk::query;

/**
Account ->
- Principal Ids
**/

#[query]
fn hello() -> Result<String, String> {
    Ok(String::from("hello"))
}

ic_cdk_macros::export_candid!();
