import { Transaction } from './Transaction';

export interface Block {
    blockID: string,
    block_header: BlockHeader,
    transactions: Transaction[]
}

export interface BlockHeader {
    raw_data: BlockRawData,
    witness_signature: string
}

export interface BlockRawData {
    number: number,
    txTrieRoot: string,
    witness_address: string,
    parentHash: string,
    version: number,
    timestamp: number
}