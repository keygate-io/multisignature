use crate::alloy_services;
use crate::evm_types;
use alloy::{
    network::{EthereumWallet, TransactionBuilder},
    primitives::{Address, U256},
    providers::{Provider, ProviderBuilder},
    rpc::types::TransactionRequest,
    signers::Signer,
    transports::icp::IcpConfig,
};
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::str;
use std::str::FromStr;

thread_local! {
    pub static KEY_NAME : std::cell::RefCell<String> = std::cell::RefCell::new("dfx_test_key".to_string());
    static NONCE: RefCell<Option<u64>> = const { RefCell::new(None) };
}

#[ic_cdk::update]
pub async fn pubkey_bytes_to_address() -> String {
    let signer = alloy_services::create_icp_sepolia_signer().await;
    let address = signer.address();
    address.to_string()
}

#[ic_cdk::update]
pub async fn get_public_key() -> Result<evm_types::PublicKeyReply, String> {
    let signer = alloy_services::create_icp_sepolia_signer().await;
    let public_key = signer.public_key().to_vec();
    Ok(evm_types::PublicKeyReply { public_key })
}

fn eth_to_wei(eth: f64) -> U256 {
    let eth_scaled = (eth * 1_000_000.0) as u64;
    let eth_u256 = U256::from(eth_scaled);

    // Multiplica en `U256` para evitar overflow en f64
    let wei_per_eth = U256::from(1e18); // 10^18 en wei
    (eth_u256 * wei_per_eth) / U256::from(1_000_000)
}

#[ic_cdk::update]
pub async fn execute_transaction_evm(
    request: evm_types::TransactionRequestBasic,
) -> evm_types::TransactionResult {
    // Setup signer
    let signer = alloy_services::create_icp_sepolia_signer().await;
    let address = signer.address();
    // Setup provider
    let wallet = EthereumWallet::from(signer);
    let config = match request.chain.as_str() {
        "eth" => IcpConfig::new(alloy_services::get_rpc_service_sepolia()),
        "base" => IcpConfig::new(alloy_services::get_rpc_service_base()),
        "polygon" => IcpConfig::new(alloy_services::get_rpc_service_polygon()),
        _ => {
            return evm_types::TransactionResult {
                hash: String::new(),
                status: "Failed: Unsupported chain.".to_string(),
            }
        }
    };
    let provider = ProviderBuilder::new()
        .with_gas_estimation()
        .wallet(wallet)
        .on_icp(config);

    // Attempt to get nonce from thread-local storage
    let maybe_nonce = NONCE.with_borrow(|maybe_nonce| {
        // If a nonce exists, the next nonce to use is latest nonce + 1
        maybe_nonce.map(|nonce| nonce + 1)
    });

    // If no nonce exists, get it from the provider
    let nonce = if let Some(nonce) = maybe_nonce {
        nonce
    } else {
        provider.get_transaction_count(address).await.unwrap_or(0)
    };

    let chain_id = match request.chain.as_str() {
        "eth" => 11155111,
        "base" => 84532,
        "polygon" => 80002,
        _ => 0,
    };

    let tx = TransactionRequest::default()
        .with_to(Address::from_str(&request.to).unwrap())
        .with_value(eth_to_wei(request.value.parse::<f64>().unwrap()))
        .with_nonce(nonce)
        .with_gas_limit(21_000)
        .with_chain_id(chain_id);

    let transport_result = provider.send_transaction(tx.clone()).await;
    match transport_result {
        Ok(builder) => {
            let node_hash = *builder.tx_hash();
            let tx_response = provider.get_transaction_by_hash(node_hash).await.unwrap();

            match tx_response {
                Some(tx) => {
                    // The transaction has been mined and included in a block, the nonce
                    // has been consumed. Save it to thread-local storage. Next transaction
                    // for this address will use a nonce that is = this nonce + 1
                    NONCE.with_borrow_mut(|nonce| {
                        *nonce = Some(tx.nonce);
                    });
                    evm_types::TransactionResult {
                        hash: format!("{:?}", tx.hash),
                        status: "Success".to_string(),
                    }
                }
                None => evm_types::TransactionResult {
                    hash: String::new(),
                    status: "Failed: Could not get transaction.".to_string(),
                },
            }
        }
        Err(_e) => evm_types::TransactionResult {
            hash: String::new(),
            status: "Failed: Could not get transaction.".to_string(),
        },
    }
}

#[ic_cdk::update]
pub async fn get_balance(chain: String) -> String {
    let address = alloy_services::create_icp_sepolia_signer().await.address();
    let config = match chain.as_str() {
        "eth" => IcpConfig::new(alloy_services::get_rpc_service_sepolia()),
        "base" => IcpConfig::new(alloy_services::get_rpc_service_base()),
        "polygon" => IcpConfig::new(alloy_services::get_rpc_service_polygon()),
        _ => {
            return "Unsupported chain.".to_string();
        }
    };
    let provider = ProviderBuilder::new().on_icp(config);
    let result = provider.get_balance(address).await;

    match result {
        Ok(balance) => balance.to_string(),
        Err(e) => e.to_string(),
    }
}
