import {writeFileSync} from 'fs';
import {join} from 'path';

interface BaseSerializable {
    serialize(): Uint8Array;
}

type Bufferish = string | Uint8Array | Buffer | BaseSerializable;

export function toHex(bytes: Bufferish): string {
    const hex = toHexNoPrefix(bytes);
    if (hex.startsWith("0x")) return hex;
    else return "0x" + hex;
}

function toHexNoPrefix(bytes: Bufferish): string {
    if (typeof bytes === "string") return bytes;
    if (bytes instanceof Uint8Array) return Buffer.from(bytes).toString("hex");
    if (typeof bytes.serialize === "function") return Buffer.from(bytes.serialize()).toString("hex");
    throw Error("Unknown arg");
}

// export function expectHex(value: Bufferish, expected: Bufferish): void {
//     expect(toHexNoPrefix(value)).to.equal(toHexNoPrefix(expected));
// }

export function fromHex(hexString: string): Uint8Array {
    if (hexString.startsWith("0x")) hexString = hexString.slice(2);
    return Buffer.from(hexString, "hex");
}


export async function getData() {
    const axios = require('axios').default;

    const urls = [
        ["finality.json", "https://lodestar-mainnet.chainsafe.io/eth/v1/beacon/light_client/finality_update/"],
        ["bootstrap.json", "https://lodestar-mainnet.chainsafe.io/eth/v1/beacon/light_client/bootstrap/0x43c73388a6edb74514e6b6939c3fa181fc62fb81b0d0589958491f22bef813ff"]
    ];

    for (let url of urls) {
        const d = await axios.get(url[1]).catch((err: any) => {
            console.log(err)
        });
        writeFileSync(join("data", url[0]), JSON.stringify(d));
    }
}

// TODO: fix this
export async function queryData() {
    const axios = require('axios').default;

    const urls = [
        ["finality.json", "https://lodestar-mainnet.chainsafe.io/eth/v1/beacon/light_client/finality_update/"],
        ["bootstrap.json", "https://lodestar-mainnet.chainsafe.io/eth/v1/beacon/light_client/bootstrap/"]
    ];

    const finality = await axios.get(urls[0][1]).catch((err: any) => {
            console.log(err)
        });
    console.log(finality);
    writeFileSync(join("data", urls[0][0]), JSON.stringify(finality));
    const slot: string = finality.data.finalized_header.slot;
    // TODO: you should go to beaconcha.in first to get the block hash
    const bootstrapURL = urls[1][1] + slot;
    // const bootstrapURL_good = urls[1][1] + block_hash;
    const bootstrap =  await axios.get(bootstrapURL).catch((err: any) => {
            console.log(err)
        });
    console.log(finality);

    writeFileSync(join("data", urls[1][0]), JSON.stringify(bootstrap));
}