import  axios, {AxiosInstance} from "axios";
import { APP_BASE_URL, GB_API_KEY, VAULT_ADDRESS, VAULT_PRIV_KEY } from "../config/settings";
//@ts-ignore
import TronWeb from 'tronweb';
import { Repository } from 'typeorm';
import Contract from "../entities/Contract";
import { transactionErrors } from "../config/errors/transaction.errors";
import AppDataSource from "../config/dataSource";
import { getClientSecret } from "../helpers/auth_helpers";
import { AUTH_HEADER_KEY } from "../config/appConstants";

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

    calculateTotalByte(object = {}){
        let totalBytes = 0;
        const objectKeys = Object.keys(object);
        if(objectKeys.length > 0){
            objectKeys.forEach((key) => {
                totalBytes += object[key].toString().length;
            })
        }
        return totalBytes;
    }

    async fetchContractApi(contractAddress: string){
        this.tronWeb = this.tronWeb ?? this.getVaultInstance();
        return await this.tronWeb.contract().at(contractAddress);
    }

    async appClient(){
        const headers = {"Content-Type":"application/json"}
        headers[AUTH_HEADER_KEY] = await getClientSecret()
        return axios.create({
            baseURL: APP_BASE_URL,
            headers
        })
    }



    getConnection(){
        return this;
    }


}

export default Service;