import { Response } from 'express';
import { Request } from 'express';
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
            const block = await tronWeb.trx.getBlock(34739999)
            res.json({block});
        } 
        catch(e){
            console.log(e);
            res.status(500).json({message:"Invalid exception"})
        }
    }
}

export default Controller;