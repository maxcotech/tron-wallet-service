import Controller from './Controller';
import TransactionService from '../services/TransactionService';
import { HttpRequestParams } from './../dataTypes/Http';
import { DECIMAL_PLACES, VAULT_ADDRESS } from '../config/settings';
import AppDataSource from './../config/dataSource';
import Contract from './../entities/Contract';
import { transactionErrors } from './../config/errors/transaction.errors';

export default class TransactionController extends Controller {

    public static async getFeeEstimate({ req }: HttpRequestParams) {
        const txnService = new TransactionService();
        const feeUnits = await txnService.fetchFeeLimitInSun();
        const contractRepo = AppDataSource.getRepository(Contract)
        const getContractDecimalPlaces = async () => {
            const contract = await contractRepo.findOne({ where: { contractAddress: req.query.contract as string } })
            return contract?.decimalPlaces;
        }
        return {
            feeUnits,
            fee: feeUnits / 10 ** ((req.query?.contract) ? await getContractDecimalPlaces() : DECIMAL_PLACES),
            amount: req.query?.amount,
            from: req.query?.from,
            to: req.query?.to
        }
    }

    public static async createTransaction({ req, res }: HttpRequestParams) {
        const { toAddress, fromAddress, contractAddress, amount } = req.body ?? {};
        if (!!toAddress === false) throw new Error(transactionErrors.recipientAddressRequired);
        if (!!amount === false) throw new Error(transactionErrors.amountRequired);
        const txnService = new TransactionService();
        const contractRepo = AppDataSource.getRepository(Contract);
        const contract = (!!contractAddress) ? await contractRepo.findOneBy({ contractAddress }) : null;
        const result = await txnService.sendTransferTransaction(
            amount,
            fromAddress ?? VAULT_ADDRESS,
            toAddress,
            contract?.id
        )
        return { sentTransaction: result, amount }
    }

}