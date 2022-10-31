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
    
    const beaconApiUrl = "https://lodestar-mainnet.chainsafe.io";
    const genesisValidatorsRootVal = await getGenesisValidatorRoot(beaconApiUrl);
    const genesisData = {
        genesisTime: 1606824023,
        genesisValidatorsRoot: genesisValidatorsRootVal
    }

    const config = createIBeaconConfig(chainConfig, genesisValidatorsRootVal);

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
 * Helper function to get the latest checkpoint
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
 * Helper function to get tgenesis validator root.
 * 
 * @param beaconApiUrl {string} - URL to connect to.
 * @returns U8a - The root
 */
async function getGenesisValidatorRoot(beaconApiUrl: string) {
    const pre_client = getClient({ baseUrl: beaconApiUrl }, { config: configDefault });
    return (await pre_client.beacon.getGenesis()).data.genesisValidatorsRoot
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
    const {headerRoot, sig} = await getHeader(header_data.slot)

    const signingRoot = ssz.phase0.SigningData.hashTreeRoot({
        objectRoot: headerRoot,
        domain: config.getDomain(header_data.slot, DOMAIN_SYNC_COMMITTEE)
    });

    console.log("Signing Root:", signingRoot)


    // const pubkeys: string[] = await getPublickeys(headerRoot);
    // // console.log("🔑🔑🔑 Pubkeys:", pubkeys);

    // // aggregate the keys
    // const aggkey = aggregation(pubkeys);
    // console.log("🤲 🗝 Aggregate key:", toHexString(aggkey));

    // // const sig = bls.Signature.fromBytes(signingRoot, undefined, true);
    // const signature = bls.Signature.fromHex(sig);
    // console.log("🎨 Signature:", signature);

    // // @ts-ignore
    // return signature.verify(aggkey, signingRoot);
}

/**
 * Get the public keys by doing a GET request to the lodestar mainnet bootstrap endpoint.
 * 
 * @param bodyRoot {string} - The root of the header to get the bootstrap response form the endpoint.
 * @returns array of public keys from the response.
 */
async function getPublickeys(blockRoot: string) {

    const pkEndpoint = `https://lodestar-mainnet.chainsafe.io/eth/v1/beacon/light_client/bootstrap/${blockRoot}`

    let responseData;
    try {
        responseData = await axios.get(pkEndpoint).then(res => res.data);

        console.log("Bootstrap:", responseData)
    } catch (e) {
        (e as Error).message = `Error getting the public keys: ${(e as Error).message}`;
        throw e;
    }

    try {
        const filePath = join("data", "pubkeys.json");
        writeFileSync(filePath, JSON.stringify(responseData));
        console.log(`✍️ Storing data to '${filePath}'`)
    } catch (e) {
        (e as Error).message = `Error writing the public keys to file: ${(e as Error).message}`;
        throw e;
    }

    return responseData.data.current_sync_committee.pubkeys;
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

async function getHeader(slot: number): Promise<any> {
    const endpoint = `https://lodestar-mainnet.chainsafe.io/eth/v1/beacon/headers?slot=${slot}`
    const responseData = await axios.get(endpoint).then(res => res.data).catch(err => console.log(err))
    return {
        headerRoot: responseData.data[0].root, 
        sig: responseData.data[0].header.signature
    } 
}


// Main function call
await main()
