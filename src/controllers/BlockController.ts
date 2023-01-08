
import Controller from './Controller';
import { Request } from 'express';
import { Response } from 'express';
import BlockService from '../services/BlockService';

export default class BlockController extends Controller {
    
    public static  async getLatestBlock(req: Request, res: Response){
        try{
            res.json({
                data: await (new BlockService()).getLatestBlockNumber()
            })
        }
        catch(e){
            let message = "An Error Occurred";
            if(e instanceof Error){
                message = e.message;
            }
            res.status(500).send({
                message
            })
        }
    }

    public static async getBlockHash(req: Request, res: Response){
        try{
            res.json({
                data: await (new BlockService()).getBlockhashByNumber(parseInt(req.params.blockNumber))
            })
        }
        catch(e){
            let message = "An Error Occurred";
            if(e instanceof Error){
                message = e.message;
            }
            res.status(500).send({
                message
            })
        }
    }

    public static async getBlock(req: Request, res: Response){
        try{
            res.json({
                data: await (new BlockService()).getBlock(req.params.blockhash)
            })
        }
        catch(e){
            let message = "An Error Occurred";
            if(e instanceof Error){
                message = e.message;
            }
            res.status(500).send({
                message
            })
        }
    }
}
