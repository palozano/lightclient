use blst::min_pk::PublicKey;

// mod validation;
mod utils;
// mod verification;

fn main() {
    // Minimal working example of public key signature from the docs
    // verification::minimal_example();

    // Read the data
    let keys = utils::read_keys();
    // Clean the values
    let cleaned_values = utils::clean_keys(keys);
    // Obtain the byte array of each key
    let byted_keys = utils::hex_to_bytes(cleaned_values);
    // Transform the bytes to public keys
    let pks = utils::bytes_to_public_keys(byted_keys);
    // println!("{:?}", pks);
    // println!("{:?}", serde_json::to_string_pretty(&pks).unwrap());
    // Aggregate all the keys into one:
    let agg_pk = utils::aggregate_public_keys(pks);
    let agg_as_pk = agg_pk.to_public_key();

    println!("Aggregated key (as public key):\n{:?}", agg_as_pk);

    // For the verification we need three things:
    //      1) the signature,
    //      2) the root hash,
    //      3) the aggregated public key (already there),
    // Read them from a file created with the light client.
}
