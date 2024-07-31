use ic_cdk::query;

/**
Account ->
- Principal Ids
**/



#[query]
fn hello() -> String {
    String::from("hello")
}

ic_cdk_macros::export_candid!();
