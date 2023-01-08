import Service from "./Service";
import { ethers } from "ethers";
import AppDataSource from "../config/dataSource";
import Wallet from "../entities/Wallet";
import { config } from "dotenv";
import { decryptObject, decryptValue } from "../helpers/object_helpers";
import crypto from "crypto";
import { Repository } from 'typeorm';
import { walletErrors } from "../config/errors/wallet.errors";
import { VAULT_ADDRESS, VAULT_PRIV_KEY } from "../config/settings";

class WalletServices extends Service {

    walletRepo: Repository<Wallet>;

    constructor(){
        super();
        this.walletRepo = AppDataSource.getRepository(Wallet);
    }
    createRandomPrivateKey(){
        return crypto.randomBytes(32).toString("hex");
    }

    createNewAccount(){
        const tronWeb = this.getVaultInstance();
        const account = tronWeb.createAccount();        
        return account;
    }

    async fetchTronBalance(address: string){
        const tronWeb = this.getVaultInstance();
        const balanceInSun = await tronWeb.trx.getBalance(address);
        return tronWeb.fromSun(balanceInSun);
    }

    async fetchTokenBalance(address: string, contractId: number){
        const contract = await this.getContract(contractId);
        const tronWeb = this.getVaultInstance();
        const balanceInSun = await tronWeb.trx.token(contract.tokenId).getBalance(address);
        return tronWeb.fromSun(balanceInSun, contract.decimalPlaces);
    }

    async fetchWalletFromAddress(address: string){
        let walletModel = await this.walletRepo.findOne({where:{address}});
        if(walletModel === null){
            console.log('Could not find any account for selected address.....',address);
            throw new Error(walletErrors.walletNotFound);
        }
        const walletCrypt = walletModel.walletCrypt;
        const wallet = decryptObject(walletCrypt);
        return wallet;
    }

    async getVaultWallet(){
        return {
            privateKey: VAULT_PRIV_KEY,
            address: {
                base58: VAULT_ADDRESS
            }
        }
    }



    
    
}

export default WalletServices