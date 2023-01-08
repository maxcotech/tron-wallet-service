import { Request, Response } from "express";
import Controller from "./Controller";
import {config} from "dotenv";

class HomeController extends Controller {
    public static index(req: Request, res: Response){
        config();
        res.send({
            hello: "my guy",
            baseUrl: req.baseUrl,
            key: process.env.SERVICE_API_KEY
        })
    }

    
}

export default HomeController;