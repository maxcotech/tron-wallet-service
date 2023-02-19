import Controller from './Controller';
import TransactionService from '../services/TransactionService';
import { HttpRequestParams } from './../dataTypes/Http';
import { VAULT_ADDRESS } from '../config/settings';
import AppDataSource from './../config/dataSource';
import Contract from './../entities/Contract';
import { transactionErrors } from './../config/errors/transaction.errors';

export default class TransactionController extends Controller{
    
    public static async createTransaction({req, res}: HttpRequestParams){
        const {toAddress, fromAddress, contractAddress, amount} = req.body ?? {};
        if(!!toAddress === false) throw new Error(transactionErrors.recipientAddressRequired);
        if(!!amount === false) throw new Error(transactionErrors.amountRequired);
        const txnService = new TransactionService();
        const contractRepo = AppDataSource.getRepository(Contract);
        const contract = (!!contractAddress)? await contractRepo.findOneBy({contractAddress}): null;
        const result = await txnService.sendTransferTransaction(
            amount,
            fromAddress ?? VAULT_ADDRESS,
            toAddress,
            contract?.id
        )
        return {sentTransaction: result, amount}
    }
     
}