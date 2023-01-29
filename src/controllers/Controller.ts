import { Response } from 'express';
import { Request } from 'express';
import { VAULT_ADDRESS } from '../config/settings';
import TransactionService from './../services/TransactionService';

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
                hexAddress: tronWeb.address.toHex('TYgyacFhwwNvtF44QVMxbMUQxGSUSGTFAa'),
                data,balance:tronWeb.fromSun(1000000),feeLimit: await service.fetchFeeLimitInSun()});
        } 
        catch(e){
            console.log(e);
            res.status(500).json({message:"Invalid exception"})
        }
    }
}

export default Controller;