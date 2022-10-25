use blst::min_pk::{AggregatePublicKey, PublicKey};
use hex;
use serde::{Deserialize, Serialize};
use std::fs;

// TODO: Refactor this to work with the bootstrap value from the server (see previous_data)
#[derive(Serialize, Deserialize)]
struct PubKeyData {
    pub_keys: Vec<String>,
    aggregate_pubkey: String,
}

// From the docs, this example:
//
// let json: serde_json::Value = serde_json::from_str(the_file).expect("JSON was not well-formatted.");
//
// This could help with the refactor above.
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

    // Iterative implementation
    // let mut pkeys: Vec<PublicKey> = Vec::with_capacity(values.len());
    // for i in 0..values.len() {
    //     let pkey =
    //         PublicKey::from_bytes(&values[i]).expect("Failed to create the public key from bytes");
    //     pkeys[i] = pkey;
    // }

    pkeys
}

pub fn aggregate_public_keys(pkeys: Vec<PublicKey>) -> AggregatePublicKey {
    // temporay vector for easy conversion
    let tmp: Vec<&PublicKey> = pkeys.iter().map(|pk| pk).collect();
    let pkeys_ref = &tmp[..];

    // from https://github.com/supranational/blst/blob/master/bindings/rust/src/lib.rs#L1006
    let agg_pk = AggregatePublicKey::aggregate(pkeys_ref, true);

    agg_pk.unwrap()
}
