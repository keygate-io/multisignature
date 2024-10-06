use serde::{Deserialize, Serialize};
use candid::{CandidType};
use ic_ledger_types::{Subaccount};
use ic_stable_structures::storable::{Bound, Storable};
use std::{borrow::Cow};

#[derive(Default, CandidType, Deserialize, Serialize)]
pub struct Cbor32(pub [u8; 32]);

impl Storable for Cbor32 {
    const BOUND: Bound = Bound::Bounded {
        max_size: 32,
        is_fixed_size: true,
    };

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        let mut buf = vec![];
        ciborium::ser::into_writer(&self.0, &mut buf).unwrap();
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        Self(ciborium::de::from_reader(bytes.as_ref()).unwrap())
    }
}

pub struct CborSubaccount(pub Subaccount);

impl Storable for CborSubaccount {
    const BOUND: Bound = Bound::Bounded {
        max_size: 34,
        is_fixed_size: true,
    };

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        let mut buf = vec![];
        ciborium::ser::into_writer(&self.0, &mut buf).unwrap();
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        Self(ciborium::de::from_reader(bytes.as_ref()).unwrap())
    }
}