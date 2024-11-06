use alloy::{
    signers::icp::IcpSigner,
    transports::icp::{EthSepoliaService, RpcApi, RpcService},
};

use crate::evm::KEY_NAME;
pub async fn create_icp_sepolia_signer() -> IcpSigner {
    let ecdsa_key_name = KEY_NAME.with(|key_name| key_name.borrow().clone());
    IcpSigner::new(vec![], &ecdsa_key_name, None).await.unwrap()
}

pub fn get_rpc_service_sepolia() -> RpcService {
    RpcService::EthSepolia(EthSepoliaService::PublicNode)
}

pub fn get_rpc_service_base() -> RpcService {
    // RpcService::BaseMainnet(L2MainnetService::PublicNode)
    RpcService::Custom(RpcApi {
        url: "https://sepolia.base.org/".to_string(),
        headers: None,
    })
}

pub fn get_rpc_service_polygon() -> RpcService {
    RpcService::Custom(RpcApi {
        url: "https://rpc-amoy.polygon.technology".to_string(),
        headers: None,
    })
}
