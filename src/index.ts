import express from "express";
import HomeController from "./controllers/HomeController";
import WalletController from './controllers/WalletController';
import AppDataSource from './config/dataSource';
import TransactionController from './controllers/TransactionController';
import bodyParser from "body-parser";
import { requireAuthKey } from "./helpers/auth_helpers";
import AppService from "./services/AppService";
import Controller from "./controllers/Controller";
import MessageQueueService from "./services/MessageQueueService";
import ContractController from "./controllers/ContractController";
import { PORT } from "./config/settings";
import ConfirmationService from "./services/ConfirmationService";

const app = express();
const jsonParser = bodyParser.json();
AppDataSource.initialize().then(() => {
    console.log('Data Store initialized.');
    (async () => {
        const appService = new AppService();
        const messageService = new MessageQueueService();
        const confirmationService = new ConfirmationService();
        app.post("/address", jsonParser, await requireAuthKey(WalletController.createAccount));
        app.post("/transaction", jsonParser, await requireAuthKey(TransactionController.createTransaction));
        app.get('/test-run', Controller.testRun);
        app.get('/retry-failed', async (req, res) => res.json({ message: await messageService.reQueueFailedMessages() }));
        app.post("/contract", jsonParser, await requireAuthKey(ContractController.saveContract));
        app.delete('/contract/:address', await requireAuthKey(ContractController.deleteContract));
        app.get("/fee-estimate", await requireAuthKey(TransactionController.getFeeEstimate));
        app.get('/wallet-balance', await requireAuthKey(HomeController.walletBalance));
        app.get("/", HomeController.index);

        app.listen(PORT, () => {
            console.log(`Tron wallet service running on port ${PORT}`);
        })
        messageService.processMessageQueue();
        appService.syncBlockchainData();
        confirmationService.processUnconfirmedTransactions();
    })()


}).catch((err) => {
    console.log('Data store initialization failed', err);
});

