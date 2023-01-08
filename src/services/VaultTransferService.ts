import Service from "./Service"
import { Repository } from 'typeorm';
import VaultTransfer from "../entities/VaultTransfer";
import AppDataSource from "../config/dataSource";
import { VaultTransferStatuses } from "../config/enums";
import { sumItemValues } from "../helpers/array_helpers";
import TransactionService from "./TransactionService";


export default class VaultTransferService extends Service {
    transferRepo: Repository<VaultTransfer>
    constructor(){
        super();
        this.transferRepo = AppDataSource.getRepository(VaultTransfer);
    }

    async processPendingTokenToVaultTxn(fromAddress: string){
        const pendingTxns = await this.transferRepo.findBy({fromAddress,status: VaultTransferStatuses.pending});
        if(pendingTxns.length > 0){
            const groups = this._groupTransactions(pendingTxns);
            const groupKeys = Array.from(groups.keys());
            groupKeys.forEach((key) => {
                const selectedGroup = groups.get(key);
                if((selectedGroup?.length ?? 0) > 0){
                    const totalValue = sumItemValues(selectedGroup ?? [],"value");
                    const txnService = new TransactionService();
                    //await txnService.
                    //TODO
                }
            })
        }
    }

    _groupTransactions(txns: VaultTransfer[]){
        const grouped = new Map<number,VaultTransfer[]>()
        txns.forEach((txn) => {
            if(grouped.has(txn.contractId)){
                const selectedGroup = grouped.get(txn.contractId) ?? [];
                selectedGroup?.push(txn)
                grouped.set(txn.contractId,selectedGroup);
            } else {
                grouped.set(txn.contractId,[txn])
            }
        })
        return grouped;
    }


    



}