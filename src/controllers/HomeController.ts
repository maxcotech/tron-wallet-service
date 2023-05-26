import { Request, Response } from "express";
import AppService from "../services/AppService";
import Controller from "./Controller";
import { VAULT_ADDRESS } from "../config/settings";
import AppDataSource from "../config/dataSource";
import Contract from "../entities/Contract";
import TransactionService from './../services/TransactionService';

class HomeController extends Controller {
    public static async index(req: Request, res: Response){
        const {address} = req.query;
        const appService = new AppService();
        const txnService = new TransactionService()
        const repo = AppDataSource.getRepository(Contract);
        const addressId = (await repo.findOneBy({contractAddress:address as string}))?.id;
        res.send({
            hello: "Hello Welcome to tron wallet ",
            info: {
                latestBlock: await appService.getLatestBlockNumber(),
                consolidatedBlock: await appService.getLastIndexedNumber(),
                vaultAddress: VAULT_ADDRESS,
                received: await txnService.getWalletAccountInfo(addressId)
            },
            baseUrl: req.baseUrl
          
        })
    }

    

    
}

export default HomeController;