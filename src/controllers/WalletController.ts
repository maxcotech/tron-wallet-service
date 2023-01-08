import Controller from './Controller';
import WalletServices from '../services/WalletServices';
import { HttpRequestParams } from '../dataTypes/Http';
import AppDataSource from '../config/dataSource';
import Wallet from '../entities/Wallet';
import { encryptObject } from '../helpers/object_helpers';

export default class WalletController extends Controller {
    public static async createAccount({req,res}: HttpRequestParams){
       const walletService = new WalletServices();
       const account = await walletService.createNewAccount();
       const address = account.address.base58;
       const walletRepo = AppDataSource.getRepository(Wallet);
       const userId =  req.body.userId;
       await walletRepo.save({
            address,
            userId,
            walletCrypt: encryptObject(account)
       })
       return {address,userId};
    }
}

