import { AxiosInstance } from "axios";
import AppDataSource from "../config/dataSource";
import { TXN_CONFIRM_MIN } from "../config/settings";
import ReceivedTransaction from "../entities/ReceivedTransaction";
import Service from "./Service";
import { Repository } from 'typeorm';

export default class ConfirmationService extends Service {
     queueHandler: any = null;
     receivedRepo: Repository<ReceivedTransaction>
     constructor() {
          super();
          this.receivedRepo = AppDataSource.getRepository(ReceivedTransaction);
          this.tronWeb = this.getVaultInstance();
     }

     async confirmTransaction(txn: ReceivedTransaction, client: AxiosInstance) {
          if (txn.sentToVault != true) {
               const response = await client.post(`transactions/chain/confirm`, {
                    transaction: txn.txId
               })
               if (response.status === 200 || response.status === 204) {
                    console.log('Message sent successfully......', txn.txId)
               }
          }
          this.receivedRepo.update({ id: txn.id }, { confirmed: true });
     }



     async processUnconfirmedTransactions(timeout = 5000) {
          if (this.queueHandler !== null) {
               clearTimeout(this.queueHandler);
               this.queueHandler = null;
          }
          try {
               this.queueHandler = setTimeout(async () => {
                    const txns = await this.receivedRepo.find({
                         where: { confirmed: false },
                         order: { id: "DESC" }
                    })
                    if (txns.length > 0) {
                         const currentBlock = await this.tronWeb.trx.getCurrentBlock();
                         const currentBlockNumber = currentBlock.block_header.raw_data.number;
                         const minRequiredConfirmations = parseInt(TXN_CONFIRM_MIN as string);
                         const client = await this.appClient();
                         for await (let txn of txns) {
                              const txnDetails = await this.tronWeb.trx.getTransactionInfo(txn.txId);
                              if (txnDetails?.blockNumber) {
                                   const confirmations = currentBlockNumber - txnDetails.blockNumber;
                                   if (confirmations >= minRequiredConfirmations) {
                                        await this.confirmTransaction(txn, client);
                                   }
                              }

                         }
                    }
                    return this.processUnconfirmedTransactions();

               }, timeout)
          }
          catch (e) {
               console.log(e);
               return this.processUnconfirmedTransactions(5000)
          }
     }

}