/** 
 * test helpers
 */

import { calcTxHash } from '../chain/blockchain';
import { CommitteeConfig, Forger, ForgerCommittee, Transaction } from '../chain/schema.s';
import { signTx } from '../chain/transaction';
import { deriveInitWeight } from '../consensus/committee';
import { GENESIS } from '../params/genesis';
import { buf2Hex, genKeyPairFromSeed, getRand, hex2Buf, pubKeyToAddress, sha256 } from './crypto';
import { persistBucket } from './db';

export const buildForgerCommittee = (): void => {
    const bkt = persistBucket(ForgerCommittee._$info.name);
    if (bkt.get<string, [ForgerCommittee]>('FC')[0]) {
        return;
    }

    const bkt2 = persistBucket(CommitteeConfig._$info.name);
    const cc = bkt2.get<string, [CommitteeConfig]>('CC')[0];

    const forgerPerGroup = 2;
    const fc = new ForgerCommittee();
    fc.groups = [];
    fc.waitsForAdd = new Map();
    fc.waitsForRemove = new Map();
    
    for (let i = 0; i < cc.maxGroupNumber; i++) {
        fc.groups.push([]);

        for (let j = 0; j < forgerPerGroup; j++) {
            const fg = new Forger();
            fg.address = pubKeyToAddress(sha256(j.toString() + i.toString()));
            fg.pk = j.toString();
            fg.pubKey = sha256(j.toString() + i.toString());
            fg.groupNumber = i;
            fg.initWeigth = getRand(1)[0] * getRand(1)[0];
            fg.lastHeight = 0;
            fg.lastWeight = 0;
            fg.stake = getRand(1)[0] * getRand(1)[0] + 10000;

            fc.groups[i].push(fg);
        }
    }

    bkt.put('FC', fc);
};

export const generateTxs = (len: number): Transaction[] => {
    const txBkt = persistBucket(Transaction._$info.name);
    const res = [];
    for (let i = 0; i < len; i++) {
        const [privKey, pubKey] = genKeyPairFromSeed(getRand(32));

        const t = new Transaction();
        t.gas = getRand(1)[0];
        t.txType = 0;
        t.from = pubKeyToAddress(pubKey);
        t.to = pubKeyToAddress(pubKey);
        t.price = getRand(1)[0];
        t.value = getRand(1)[0];
        t.nonce = getRand(1)[0];
        t.payload = 'abc';
        t.lastOutputValue = getRand(1)[0];

        signTx(privKey, t);
        t.signature = t.signature;

        txBkt.put(t.txHash, t);
        res.push(t);
    }

    return res;
};

export const generateAccounts = (len: number): void => {
    return;
};

export const generateMiners = (len: number): void => {
    const bkt = persistBucket(ForgerCommittee._$info.name);
    for (let i = 0; i < len; i++) {
        console.log('group number ====================== ', i);
        let count = 0;
        const forgers = [];
        // tslint:disable-next-line:no-constant-condition
        while (true) {
            const [privKey, pubKey] = genKeyPairFromSeed(getRand(32));
            const address = pubKeyToAddress(pubKey);
            const groupNumber = parseInt(address.slice(address.length - 2), 16);
            const stake = new DataView(getRand(4).buffer).getUint32(0) % 10000 + 10000;
            if (groupNumber === i) {
                count += 1;
                // console.log('{');
                // console.log('address: ', `'${address}',`);
                // console.log('pubKey: ', `'${buf2Hex(pubKey)}',`);
                // console.log('privKey: ', `'${buf2Hex(privKey)}',`);
                // console.log('stake: ', stake);
                // console.log('},');
                // console.log('\n');

                const forger = new Forger();
                forger.address = address;
                forger.groupNumber = i;
                forger.initWeight = deriveInitWeight(address, hex2Buf(GENESIS.blockRandom), 0, stake);
                forger.lastHeight = 0;
                forger.lastWeight = 0;
                forger.pubKey = buf2Hex(pubKey);
                forger.stake = stake;

                forgers.push(forger);

            }
            
            if (count >= 5) {
                break;
            }
        }

        const fc = new ForgerCommittee();
        fc.slot = i;
        fc.forgers = forgers;

        bkt.put(fc.slot, fc);
    }

    return;
};