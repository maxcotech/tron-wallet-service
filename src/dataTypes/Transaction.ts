import { ContractTypes } from "../config/enums"

export interface Transaction {
        visible: boolean,
        txID: string,
        raw_data: TransactionRawData,
        raw_data_hex: string
}

export interface TransactionRawData {
        contract: Contract[],
        ref_block_bytes: string,
        ref_block_hash: string,
        expiration: number,
        timestamp: number
}

export interface Contract {
    parameter: ContractParameter,
    type: ContractTypes
}

export interface ContractParameter {
    value: ContractParameterValue,
    type_url: string
}

export interface ContractParameterValue {
    amount: number,
    owner_address: string,
    to_address: string
}