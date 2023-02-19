import { Request, RequestHandler, Response } from 'express';
import { HttpRequestParams } from './../dataTypes/Http';
import { generalErrors } from './../config/errors/general.errors';
import { AUTH_HEADER_KEY } from '../config/appConstants';
import { CLIENT_AUTH } from '../config/settings';
import { successWithData } from '../config/responseTypes';

export async function requireAuthKey(controller: (params: HttpRequestParams) =>  Promise<any>): Promise<RequestHandler> {
    return async (req: Request, res: Response) => {
        try{
            const clientAuth = req.headers[AUTH_HEADER_KEY];
            if(clientAuth && authKeyIsValid(clientAuth)){
                const data = await controller({req,res})
                return successWithData(data,res);
            }
            return res.status(401).json({
                success: false,
                message: generalErrors.notAuthorized
            })
        }
        catch(e){
            console.log(e);
            res.status(500).json({
                success: false,
                message: e.message ?? generalErrors.internalServerError
            })
        }
    }
}

function authKeyIsValid(authKey: any){
    return (authKey === CLIENT_AUTH);
}

export async function getClientSecret(){
    return CLIENT_AUTH;
}