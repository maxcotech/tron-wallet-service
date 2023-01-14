
export interface TransactionInfoReceipt {
    origin_energy_usage: number,
    energy_usage_total: number,
    net_fee: number,
    result: string
}

export interface TransactionInfoLog {
    address: string,
    topics: string[],
    data: string
}

export interface InternalTransaction {
    hash: string,
    caller_address: string,
    transferTo_address: string,
    callValueInfo: CallValueInfo[],
    note: string
}

export interface CallValueInfo {
    callValue : number,
    tokenId: null | string
}

export interface TransactionInfo {
    id: string,
    fee: number,
    blockNumber: number,
    blockTimeStamp: number,
    contractResult: string[],
    contract_address: string,
    receipt: TransactionInfoReceipt,
    log: TransactionInfoLog[],
    internal_transactions: InternalTransaction[]
}