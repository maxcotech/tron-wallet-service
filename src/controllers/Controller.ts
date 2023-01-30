import { Response } from 'express';
import { Request } from 'express';
import { VAULT_ADDRESS } from '../config/settings';
import TransactionService from './../services/TransactionService';
import { decodeAmountInEvent } from './../helpers/conversion_helpers';

class Controller {
    public static successWithData(res: Response,data: any, message: string = "successful"){
        res.json({
            message,
            data
        })
    }

    public static async testRun(req: Request, res: Response){
        try{
            const service = new TransactionService();
            const tronWeb = service.tronWeb;
            const contractApi = await tronWeb.contract().at('TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf');
            const result = await contractApi.balanceOf('TYgyacFhwwNvtF44QVMxbMUQxGSUSGTFAa').call() //await tronWeb.trx.getChainParameters();
            const data = {...result,balance:tronWeb.fromSun(parseInt(result._hex,16),6)}
            res.json({
                usdt_bal: tronWeb.fromSun(parseInt(result._hex,16),6),
                feeLimit: tronWeb.fromSun(225000000),
                resp: tronWeb.address.fromHex('416d3d7bf4a19e519b7f6d5829cb8a4b3eb81db476'),
                amount: tronWeb.fromSun(decodeAmountInEvent('0000000000000000000000000000000000000000000000000000000005f5e100')),
                //tron_bal: tronWeb.fromSun(await tronWeb.trx.getBalance(VAULT_ADDRESS)),
                //account_resource: await tronWeb.trx.getAccountResources(VAULT_ADDRESS),
                txn: await tronWeb.trx.getTransaction('06eafddea239a4680bf93c93d5198b59c1de14f7fb5681ca43587af03eddb3a7'),
                //txn_info: await tronWeb.trx.getTransactionInfo("06eafddea239a4680bf93c93d5198b59c1de14f7fb5681ca43587af03eddb3a7")
        });
        } 
        catch(e){
            console.log(e);
            res.status(500).json({message:"Invalid exception"})
        }
    }
}

export default Controller;