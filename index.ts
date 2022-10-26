import { Lightclient, LightclientEvent } from "@lodestar/light-client";
import { ssz } from "@lodestar/types";
import { chainConfig } from "./config.js";  // for some reason this needs to be .js
import { createIChainForkConfig, createIBeaconConfig } from "@lodestar/config";
import { DOMAIN_SYNC_COMMITTEE } from "@chainsafe/lodestar-params";
import type { PublicKey, Signature } from "@chainsafe/bls/types";
import bls from "@chainsafe/bls";
import { getClient } from "@lodestar/api";
import { config as configDefault } from "@lodestar/config/default";

// import header_data from "./data/header.json" assert {type: "json"};
// import bootstrap from "./data/bootstrap.json" assert {type: "json"};


const main = async () => {
    console.log("Starting Client...")
    // test previous functionality
    // TODO: fix imports so they can come from other files
    // aggregation();
    // verification();

    // get the values to init the light-client
    // const config = createIChainForkConfig(chainConfig);
    const genesisValidatorsRootVal = fromHex("0x89614fe0b212b360baa4ef38cf4bea6852f1e15d523f84641f8f0ca7024e7e88");
    const config = createIBeaconConfig(chainConfig, genesisValidatorsRootVal);

    // https://eth-mainnet.gateway.pokt.network/v1/5f3453978e354ab992c4da79
    // https://lodestar-goerli.chainsafe.io
    // https://eth-mainnet.g.alchemy.com/v2/BItoYgjJRs22CCf8I6zj1kUkmx6f9VZP 
    const beaconApiUrl = "https://rpc.flashbots.net/";
    const genesisData = {
        genesisTime: 1606824023,
        genesisValidatorsRoot: genesisValidatorsRootVal
    }

    const finalCheckpoint = await finalizedCheckpoint(beaconApiUrl);
    console.log("Checkpoint:", finalCheckpoint.root)

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
    console.log("Started Client")

    // emit on change of header
    client.emitter.on(LightclientEvent.head, (header) => {
        console.log("New Header:", header)
        // writeFileSync(join("data", "header.json"), JSON.stringify(header));
    });
}


async function finalizedCheckpoint(beaconApiUrl: string) {
    const pre_client = getClient({ baseUrl: beaconApiUrl }, { config: configDefault });
    const res = await pre_client.beacon.getStateFinalityCheckpoints("head");
    const finalizedCheckpoint = res.data.finalized;
    return finalizedCheckpoint
}


function assertValidHeader(config: any) {
    // const bodyRoot = new Uint8Array(header_data.bodyRoot);

    // const signingRoot = ssz.phase0.SigningData.hashTreeRoot({
    //     objectRoot: bodyRoot,
    //     domain: config.getDomain(header_data.slot, DOMAIN_SYNC_COMMITTEE)
    // });

    // const pubkeys = bootstrap.data.current_sync_committee.pubkeys.map(p => bls.PublicKey.fromBytes(fromHex(p)));

    // // I get this value from beaconcha.in, so I can get the signature values,
    // // because in the finality request, I cannot specify the slot number.
    // console.log("IS A VALID AGGREGATE? -> " + isValidBlsAggregate(pubkeys, signingRoot, fromHex(header_data.signature)));
    // console.log("IS A VALID AGGREGATE? -> " + isValidBlsAggregate(pubkeys, signingRoot, fromHex(header_data.signature_sync)));
}

// async function assertValidSignedHeaderLocal(
//     sig: string,
//     pubkeys: string[],
//     header: any
// ) {
//     // const participantPubkeys = getParticipantPubkeys(syncCommittee.pubkeys, syncAggregate.syncCommitteeBits);
//     // TODO: check that they are not using _just_ the pubkeys with a bit == 1 in the aggregation.
//
//     const participantPubkeys: PublicKey[] = pubkeys.map(p => bls.PublicKey.fromBytes(fromHex(p)));
//     const syncCommitteeSignature: Uint8Array = fromHex(sig);
//     const signedHeaderRoot: Uint8Array = header.bodyRoot;
//
//     const signingRoot = ssz.phase0.SigningData.hashTreeRoot({
//         objectRoot: signedHeaderRoot,
//         domain: config.getDomain(header_data.slot, DOMAIN_SYNC_COMMITTEE),
//     });
//
//     const isValid = isValidBlsAggregate(participantPubkeys, signingRoot, syncCommitteeSignature);
//     if (!isValid) {
//         throw Error("Invalid aggregate signature");
//     } else {
//         console.log("correct");
//     }
//
//     return isValid
// }


// function isValidBlsAggregate(publicKeys: PublicKey[], message: Uint8Array, signature: Uint8Array) {

//     let aggPubkey: PublicKey;
//     try {
//         aggPubkey = bls.PublicKey.aggregate(publicKeys);
//     } catch (e) {
//         (e as Error).message = `Error aggregating pubkeys: ${(e as Error).message}`;
//         throw e;
//     }

//     let sig: Signature;
//     try {
//         sig = bls.Signature.fromBytes(signature, undefined, true);
//     } catch (e) {
//         (e as Error).message = `Error deserializing signature: ${(e as Error).message}`;
//         throw e;
//     }

//     try {
//         return sig.verify(aggPubkey, message);
//     } catch (e) {
//         (e as Error).message = `Error verifying signature: ${(e as Error).message}`;
//         throw e;
//     }
// }

// getDomain(stateSlot: Slot, domainType: DomainType, messageSlot ?: Slot): Uint8Array {
//     // ```py
//     // def get_domain(state: BeaconState, domain_type: DomainType, epoch: Epoch=None) -> Domain:
//     //   """
//     //   Return the signature domain (fork version concatenated with domain type) of a message.
//     //   """
//     //   epoch = get_current_epoch(state) if epoch is None else epoch
//     //   fork_version = state.fork.previous_version if epoch < state.fork.epoch else state.fork.current_version
//     //   return compute_domain(domain_type, fork_version, state.genesis_validators_root)
//     // ```

//     const epoch = Math.floor((messageSlot ?? stateSlot) / SLOTS_PER_EPOCH);
//     // Get pre-computed fork schedule, which _should_ match the one in the state
//     const stateForkInfo = chainForkConfig.getForkInfo(stateSlot);
//     // Only allow to select either current or previous fork respective of the fork schedule at stateSlot
//     const forkName = epoch < stateForkInfo.epoch ? stateForkInfo.prevForkName : stateForkInfo.name;
//     const forkInfo = chainForkConfig.forks[forkName];

//     let domainByType = domainCache.get(forkInfo.name);
//     if (!domainByType) {
//         domainByType = new Map<DomainType, Uint8Array>();
//         domainCache.set(forkInfo.name, domainByType);
//     }
//     let domain = domainByType.get(domainType);
//     if (!domain) {
//         domain = computeDomain(domainType, forkInfo.version, genesisValidatorsRoot);
//         domainByType.set(domainType, domain);
//     }
//     return domain;
// },

/**
 * Helper function to convert a hex string to an array of bytes.
 *
 * @param hexString {string} - Input value as a hexadecimal number in string format
 * @returns {Uint8Array} - Array of unsigned integers
 */
function fromHex(hexString: string): Uint8Array {
    hexString = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
    return Buffer.from(hexString, "hex");
}

main()
