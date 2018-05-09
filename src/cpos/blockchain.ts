/**
 * 区块链
 */

import { Account } from "./account";
import { Transaction } from "./transaction";
import { H160, H256, keccak } from "./util";

// 区块的最大大小，8388608 字节
const MAX_BLOCK_SIZE = 8 * 1024 * 1024;

/**
 * 区块头，目前 100字节
 */
export class BlockHead {
    parentHash: H256;  // 父块哈希，用keccak算法
    beneficiary: H160; // 受益者地址
    txHash: H256;      // 交易根节点哈希，用keccak算法
    maxSize: number;   // u32, 块大小，先限定8M，字节数
    timestamp: number; // u64, 时间戳，创建时候的Unix时间

    // 下面为不发送到网络的字段，也不参与hash
    index: number;     // u32, 区块编号，创世区块为0开始
    hash: H256;

    /**
     * @param isAll 是否序列化所有字段
     */
    serialization(isAll: boolean) {
        return new Uint8Array(100);
    }
}

export class BlockBody {
    accounts: Account[];          // 状态列表
    transactions: Transaction[];  // 交易列表
}

export class Block {
    head: BlockHead;
    body: BlockBody;
}

/**
 * 区块链
 */
export class BlockChain {
    blocks: Block[];
    index_headers: Map<H256, Block>;

    /**
     * 加入块头，验证
     */
    addHead(head: BlockHead) {
        let hash = keccak(head.serialization(false))
        if(this.index_headers.get(hash)) {
            return false;
        }
        // 父节点hash不是当前链最后一个节点的hash，返回
        // 加到链上
    }

    /**
     * 加入块体，验证
     */
    addBody(body: BlockBody) {
        // 找不到块，返回，孤儿节点不保留
        // body hash不对，返回
        
        // 用事务处理交易，检查交易的合法性，如果某笔交易不合法，状态回滚，块（包括已加入的块头）扔掉
        // 如果有交易是锻造相关交易，加入锻造者委员会
        // 将块加到链上
    }

    /**
     * 取[start, end)区间内的区块头的序列化，用于发送到网络
     */
    getHead(start: number, end: number) {
        return new Uint8Array(end-start);
    }

    /**
     * 取index区块体的序列化，用于发送到网络
     */
    getBody(index: number) {
        return new Uint8Array(1);
    }

    
}