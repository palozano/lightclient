import {PublicKey, aggregatePubkeys, verify, Signature} from "@chainsafe/blst";
import {fromHex, toHex} from "./utils";
import bootstrap from './data/bootstrap.json';
import finality from './data/finality.json';


// // get the agg value and the verification
// const aggregate_pkey = aggregation(pubkeys, aggkey);
// if (typeof(aggregate_pkey) != undefined) {
//     // verification(sync_committee_signature, aggregate_pkey);
//     console.log("verification...")
// } else {
//     console.log("The aggregate couldn't be computed")
// }

function getKeys() {
    // extract the data
    const pubkeys = bootstrap["data"]["current_sync_committee"]["pubkeys"];
    const aggkey = bootstrap["data"]["current_sync_committee"]["aggregate_pubkey"];
    // const sync_committee_signature = finality.data.sync_aggregate.sync_committee_signature;

    return { pubkeys, aggkey }
}

// @ts-ignore
export function aggregation() {
    // get the data
    const {
        pubkeys, aggkey
    } = getKeys();

    // construct the PublicKeys from the data
    const pkeys = pubkeys.map((hex: string) => PublicKey.fromBytes(fromHex(hex)));

    // aggregate them into one public key
    const agg_pubkeys = aggregatePubkeys(pkeys);

    console.log("Computed aggregate public key (in bytes): " + agg_pubkeys.toBytes());
    console.log("Computed aggregate public key (in hex): " + toHex(agg_pubkeys.toBytes()));
    console.log("Downloaded aggregated public key: " + aggkey);

    // check our computed value is the same as the one downloaded
    const equality = toHex(agg_pubkeys.toBytes()) === aggkey

    if (equality) {
        // console.log("Are they the same? " + equality);
        return toHex(agg_pubkeys.toBytes())
    } else {
        console.log("Error, keys do not match.")
    }
}

export function verification() {

    console.log("Running with hardcoded data...")

    const block_root = "0x49466fb9252622d84141ea8a94bbb9888388b8a1051baea7a435d637b20ebf13";
    const msg = Buffer.from(fromHex(block_root));

    const aggregate_pk = "0xb476231da94065ccc88969e70782a74b12f559a5f17983e5443ab36cd132aa8216de888d8a9e4fee3265a5c784a093d9";
    const pk = PublicKey.fromBytes(fromHex(aggregate_pk));

    // console.log(_outside_signature);
    const sig = Signature.fromBytes(fromHex("0xb3d3a73fd387355aaf6d9c548586dba617430b77d6447a96e7642ac117e5b18495bd8e3a8fa8e3e21337f21db522fea1113f05ebf160937c650bafe2348cb0e9a6259b2b0a6190b7683102dd6362601ff1b7c1f00746ac08f5ab8e7d948a980f"));

    const is_correct = verify(msg, pk, sig);
    console.log("VERIFICATION SUCCEEDED? " + is_correct);

    // console.log("Prueba: " + Signature.verify())
}



