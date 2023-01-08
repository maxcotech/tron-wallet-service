import  { AxiosInstance } from "axios";
import { GB_API_KEY, VAULT_ADDRESS, VAULT_PRIV_KEY } from "../config/settings";
//@ts-ignore
import TronWeb from 'tronweb';
import { Repository } from 'typeorm';
import Contract from "../entities/Contract";
import { transactionErrors } from "../config/errors/transaction.errors";
import AppDataSource from "../config/dataSource";

class Service {
    
    baseUrl: string;
    //@ts-ignore
    HttpProvider: TronWeb.providers.HttpProvider;
    apiKey: string | undefined;
    client: AxiosInstance;
    tronWeb: TronWeb;
    contractRepo: Repository<Contract>;


    constructor(){
        this.apiKey = GB_API_KEY;
        this.baseUrl = `https://trx.getblock.io/${GB_API_KEY}/testnet/`;
        this.HttpProvider = TronWeb.providers.HttpProvider;
        this.contractRepo = AppDataSource.getRepository(Contract);

    }

    async getContract(contractId: number){
        const contract = await this.contractRepo.findOneBy({id: contractId});
        if(contract === null) throw new Error(transactionErrors.invalidContractTransaction);
        return contract;
    }

    getTronWebInstance(privateKey: string){
        return new TronWeb({
            fullNode: new this.HttpProvider(this.baseUrl),
            solidityNode: new this.HttpProvider("https://api.nileex.io/")
        },privateKey)
    }

    getVaultInstance(){
        return this.getTronWebInstance(VAULT_PRIV_KEY);
    }

    isVaultAddress(address: string){
        return address === VAULT_ADDRESS;
    }




    getConnection(){
        return this;
    }


}

export default Service;