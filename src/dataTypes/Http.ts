import { Request, Response } from 'express';

export interface HttpRequestParams  {
    req: Request,
    res: Response
}