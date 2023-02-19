import { Request, Response } from "express";
import Controller from "./Controller";

class HomeController extends Controller {
    public static index(req: Request, res: Response){
        res.send({
            hello: "Hello Welcome to tron wallet ",
            baseUrl: req.baseUrl
          
        })
    }

    

    
}

export default HomeController;