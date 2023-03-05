import { Request, Response } from "express";
import AppService from "../services/AppService";
import Controller from "./Controller";

class HomeController extends Controller {
    public static async index(req: Request, res: Response){
        const appService = new AppService();
        res.send({
            hello: "Hello Welcome to tron wallet ",
            info: {
                latestBlock: await appService.getLatestBlockNumber(),
                consolidatedBlock: await appService.getLastIndexedNumber()
            },
            baseUrl: req.baseUrl
          
        })
    }

    

    
}

export default HomeController;