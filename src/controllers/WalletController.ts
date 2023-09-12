import Controller from './Controller';
import WalletServices from '../services/WalletServices';
import { HttpRequestParams } from '../dataTypes/Http';
import AppDataSource from '../config/dataSource';
import Wallet from '../entities/Wallet';
import { encryptObject } from '../helpers/object_helpers';
import Contract from '../entities/Contract';
import { VAULT_ADDRESS } from '../config/settings';

export default class WalletController extends Controller {
    public static async createAccount({ req, res }: HttpRequestParams) {
        const walletService = new WalletServices();
        const account = await walletService.createNewAccount();
        const address = account.address.base58;
        const walletRepo = AppDataSource.getRepository(Wallet);
        const userId = req.body.userId;
        await walletRepo.save({
            address,
            userId,
            walletCrypt: encryptObject(account)
        })
        return { address, userId };
    }

    public static async walletBalance({ req, res }: HttpRequestParams) {
        const { contract, address } = req.query;
        const walletService = new WalletServices();
        const contractRepo = AppDataSource.getRepository(Contract);
        const contractData = await (async () => {
            if (!!contract === false) return null;
            return await contractRepo.findOne({ where: { contractAddress: contract as string } });
        })();
        const balance = (!!contractData?.id) ? await walletService.fetchTokenBalance((address as string) ?? VAULT_ADDRESS, contractData?.id) : await walletService.fetchCoinBalance((address as string) ?? VAULT_ADDRESS)
        return {
            balance,
            vault_address: VAULT_ADDRESS
        }
    }
}

