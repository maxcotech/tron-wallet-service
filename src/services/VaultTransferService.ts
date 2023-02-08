import Service from "./Service"
import { Repository } from 'typeorm';
import VaultTransfer from "../entities/VaultTransfer";
import AppDataSource from "../config/dataSource";
import { VaultTransferStatuses } from "../config/enums";
import { sumItemValues } from "../helpers/array_helpers";
import TransactionService from "./TransactionService";
import { VAULT_ADDRESS } from "../config/settings";


export default class VaultTransferService extends Service {
    transferRepo: Repository<VaultTransfer>
    constructor(){
        super();
        this.transferRepo = AppDataSource.getRepository(VaultTransfer);
    }

    async recordPendingVaultTransfer(fromAddress: string, vaultAddress: string, txId: string, value: any, contractId: number){
        if(await this.transferRepo.findOneBy({txId})) {
            console.log("Vault transfer already recorded ");
            return false;
        }
        const vaultTransfer = new VaultTransfer();
        vaultTransfer.fromAddress = fromAddress;
        vaultTransfer.vaultAddress = vaultAddress;
        vaultTransfer.txId = txId;
        vaultTransfer.value = value;
        vaultTransfer.contractId = contractId;
        vaultTransfer.status = VaultTransferStatuses.pending;
        return await this.transferRepo.save(vaultTransfer);
    }

    async processPendingTokenToVaultTxn(fromAddress: string){
        console.log(`process pending vault transfer for `,{fromAddress})
        const pendingTxns = await this.transferRepo.findBy({fromAddress: fromAddress,status: VaultTransferStatuses.pending});
        if(pendingTxns.length > 0){
            console.log('found pending vault transfers ');
            const groups = this._groupTransactions(pendingTxns);
            const groupKeys = Array.from(groups.keys());
            for await (let key of groupKeys){
                console.log('processing for contract ',key)
                const selectedGroup = groups.get(key);
                if((selectedGroup?.length ?? 0) > 0){
                    const totalValue = sumItemValues(selectedGroup ?? [],"value");
                    const txnService = new TransactionService();
                    console.log(`sending token to vault `,{totalValue,fromAddress,VAULT_ADDRESS,key})
                    await txnService.sendTransferTransaction(totalValue,fromAddress,VAULT_ADDRESS,key,true);
                    await this.transferRepo.update({
                        contractId: key,
                        fromAddress,
                        status:VaultTransferStatuses.pending},{status: VaultTransferStatuses.completed})
                }
            }
        } else {
            console.log('Nothing to send to vault', {fromAddress,pendingTxns,pendingVal: VaultTransferStatuses.pending});
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