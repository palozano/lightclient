import { Lightclient, LightclientEvent } from "@lodestar/light-client";
import { ssz } from "@lodestar/types";
import { chainConfig } from "./config.js"; //for some reason this must be .js
import { createIBeaconConfig, IBeaconConfig } from "@lodestar/config";
import { DOMAIN_SYNC_COMMITTEE } from "@chainsafe/lodestar-params";
import bls from "@chainsafe/bls";
import { getClient } from "@lodestar/api";
import { config as configDefault } from "@lodestar/config/default";
import { ValueOfFields } from "@chainsafe/ssz/lib/view/container.js";
import { writeFileSync } from "fs";
import { join } from "path";

import { fromHexString, toHexString } from "@chainsafe/ssz";

import { aggregatePubkeys } from "@chainsafe/blst"; // PublicKey
import type { Signature, PublicKey } from "@chainsafe/bls/types";

import axios from "axios";


async function main() {
    console.log("⏳ Starting client...")

    // this one doesn't work
    // 0x89614fe0b212b360baa4ef38cf4bea6852f1e15d523f84641f8f0ca7024e7e88"
    // but this one works. why? I don't know
    const genesisValidatorsRootVal = fromHexString("0x4b363db94e286120d76eb905340fdd4e54bfe9f06bf33ff6cf5ad27f511bfe95");

    const config = createIBeaconConfig(chainConfig, genesisValidatorsRootVal);

    const beaconApiUrl = "https://lodestar-mainnet.chainsafe.io";
    const genesisData = {
        genesisTime: 1606824023,
        genesisValidatorsRoot: genesisValidatorsRootVal
    }

    const finalCheckpoint = await finalizedCheckpoint(beaconApiUrl);
    console.log("🌓 Checkpoint:", toHexString(finalCheckpoint.root));

    const client = await Lightclient.initializeFromCheckpointRoot({
        config,
        logger: undefined,
        beaconApiUrl,
        genesisData,
        // the one that changes every (approx.) 27h
        checkpointRoot: finalCheckpoint.root
    });

    // start the client
    client.start();
    console.log("✅ Client started!")

    // emit on change of header
    client.emitter.on(LightclientEvent.head, async (header) => {
        console.log("🤖 New Header:", header)

        const isValid = await assertValidHeader(header, config);

        console.log("⁉️ Is it valid?", isValid);
    });
}


/**
 * Helper function to get the latest checkpoint.
 * 
 * @param beaconApiUrl {string} - URL to connect to.
 * @returns {ValueOfFields<{
 *              epoch: UintNumberType;
 *              root: ByteVectorType;
 *          }>} - The latest finalized checkpoint as bytes.
 */
async function finalizedCheckpoint(beaconApiUrl: string) {
    const pre_client = getClient({ baseUrl: beaconApiUrl }, { config: configDefault });
    const res = await pre_client.beacon.getStateFinalityCheckpoints("head");
    const finalizedCheckpoint = res.data.finalized;
    return finalizedCheckpoint
}


/**
 * Asserts if a header is valid based on the information from the header and
 * some extra information queried.
 * 
 * @param header_data {any} - Data from the query.
 * @param config Configuration for the beacon chain.
 * @returns T/F value for the validation.
 */
async function assertValidHeader(header_data: any, config: IBeaconConfig) {

    const bodyRoot = new Uint8Array(header_data.bodyRoot);

    const signingRoot = ssz.phase0.SigningData.hashTreeRoot({
        objectRoot: bodyRoot,
        domain: config.getDomain(header_data.slot, DOMAIN_SYNC_COMMITTEE)
    });

    const pubkeys: string[] = await getPublickeys(header_data.bodyRoot);
    // console.log("🔑🔑🔑 Pubkeys:", pubkeys);

    // aggregate the keys
    const aggkey = aggregation(pubkeys);
    console.log("🤲 🗝 Aggregate key:", toHexString(aggkey));

    // const sig = bls.Signature.fromBytes(signingRoot, undefined, true);
    const sig = bls.Signature.fromBytes(bodyRoot, undefined, true);
    console.log("🎨 Signature:", sig);

    // @ts-ignore
    return sig.verify(aggkey, signingRoot);
}

/**
 * Get the public keys by doing a GET request to the lodestar mainnet bootstrap endpoint.
 * 
 * @param bodyRoot {string} - The root of the header to get the bootstrap response form the endpoint.
 * @returns array of public keys from the response.
 */
async function getPublickeys(bodyRoot: string) {
    // const axios = require('axios').default;
    const hexBodyRoot = "0x80647902a9ec0de3acefb0f7dd9ed39d212d4ebd616032fc8742743334d18dfd";//toHex(bodyRoot);
    const pk_endpoint = `https://lodestar-mainnet.chainsafe.io/eth/v1/beacon/light_client/bootstrap/${hexBodyRoot}`

    let response_data;
    try {
        response_data = await axios.get(pk_endpoint).then(res => res.data);
    } catch (e) {
        (e as Error).message = `Error getting the public keys: ${(e as Error).message}`;
        throw e;
    }

    try {
        const filePath = join("data", "pubkeys.json");
        // writeFileSync(filePath, JSON.stringify(d));
        console.log(`✍️ Storing data to '${filePath}'`)
    } catch (e) {
        (e as Error).message = `Error writing the public keys to file: ${(e as Error).message}`;
        throw e;
    }

    return response_data.data.current_sync_committee.pubkeys;
}

/**
 * Aggregates all the public keys into one public key.
 * 
 * @param pubkeys {string[]} - Public keys as an array of string.
 * @returns The aggregated key.
 */
function aggregation(pubkeys: string[]) {
    const pkeys_uint8array = pubkeys.map(
        // (hex: string) => PK.fromBytes(fromHex(hex))
        (hex: string) => fromHexString(hex)
    );
    const agg = bls.aggregatePublicKeys(pkeys_uint8array);
    return agg;
}


// Main function call
await main()
