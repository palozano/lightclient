use blst::min_pk::{AggregatePublicKey, PublicKey};
use hex;
use serde::{Deserialize, Serialize};
use std::fs;

// TODO: Refactor to work with the bootstrap value from the server (see `previous_data` folder)

/// Structure of the incoming data.
#[derive(Serialize, Deserialize)]
struct PubKeyData {
    pub_keys: Vec<String>,
    aggregate_pubkey: String,
}

pub fn read_keys() -> Vec<String> {
    let the_file = fs::File::open("data/pubkeys.json").expect("File should open read only.");
    let json: PubKeyData = serde_json::from_reader(the_file)
        .expect("File should be proper JSON and match the structure.");
    let keys = json.pub_keys;
    keys
}

pub fn clean_keys(values: Vec<String>) -> Vec<String> {
    let cleaned_values = values.iter().map(|pk| pk[2..].to_string()).collect();
    cleaned_values
}

pub fn hex_to_bytes(values: Vec<String>) -> Vec<Vec<u8>> {
    let byted_values = values
        .iter()
        .map(|pk| hex::decode(pk).expect("Decoding hex string to byte string failed."))
        .collect::<Vec<Vec<u8>>>();
    byted_values
}

pub fn bytes_to_public_keys(values: Vec<Vec<u8>>) -> Vec<PublicKey> {
    let pkeys: Vec<PublicKey> = values
        .iter()
        .map(|pk| PublicKey::from_bytes(pk).expect("Failed to create the public key from bytes"))
        .collect();

    pkeys
}

pub fn aggregate_public_keys(pkeys: Vec<PublicKey>) -> AggregatePublicKey {
    let tmp: Vec<&PublicKey> = pkeys.iter().map(|pk| pk).collect();
    let pkeys_ref = &tmp[..];

    // from https://github.com/supranational/blst/blob/master/bindings/rust/src/lib.rs#L1006
    let agg_pk = AggregatePublicKey::aggregate(pkeys_ref, true);

    agg_pk.unwrap()
}

fn verify_agg_key(pkey: PublicKey) -> bool {
    true
}
