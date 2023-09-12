import { Request, Response } from "express";
import AppService from "../services/AppService";
import Controller from "./Controller";
import { VAULT_ADDRESS } from "../config/settings";
import AppDataSource from "../config/dataSource";
import Contract from "../entities/Contract";
import TransactionService from './../services/TransactionService';
import { HttpRequestParams } from "../dataTypes/Http";
import WalletServices from "../services/WalletServices";

class HomeController extends Controller {
    public static async index(req: Request, res: Response) {
        const { address } = req.query;
        const appService = new AppService();
        const txnService = new TransactionService()
        const repo = AppDataSource.getRepository(Contract);
        const addressId = (await repo.findOneBy({ contractAddress: address as string }))?.id;
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

    public static async walletBalance({ req, res }: HttpRequestParams) {
        const { contract, address } = req.query;
        const walletService = new WalletServices();
        const contractRepo = AppDataSource.getRepository(Contract);
        const contractData = await (async () => {
            if (!!contract === false) return null;
            return await contractRepo.findOne({ where: { contractAddress: contract as string } });
        })();
        const balance = (!!contractData?.id) ? await walletService.fetchTokenBalance((address as string) ?? VAULT_ADDRESS, contractData?.id) : await walletService.fetchCoinBalance((address as string) ?? VAULT_ADDRESS)
        return {
            balance,
            vault_address: VAULT_ADDRESS
        }
    }




}

export default HomeController;