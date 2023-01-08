import { Response } from 'express';

export function successWithData(data: any,res: Response){
    return res.status(200).json({
        success: true,
        data
    })
}