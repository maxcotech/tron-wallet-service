import { Response } from 'express';

class Controller {
    public static successWithData(res: Response,data: any, message: string = "successful"){
        res.json({
            message,
            data
        })
    }
}

export default Controller;