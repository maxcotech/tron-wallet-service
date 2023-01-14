import "reflect-metadata"
import { DataSource } from "typeorm"
import Wallet from './../entities/Wallet';
import IndexedBlock from './../entities/IndexedBlock';
import ReceivedTransaction from "../entities/ReceivedTransaction";
import VaultTransfer from './../entities/VaultTransfer';
import SentTransaction from "../entities/SentTransaction";
import Contract from "../entities/Contract";
import FailedMessage from "../entities/FailedMessage";
import MessageQueue from "../entities/MessageQueue";

const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "",
    database: "tron_wallet_service",
    entities: [
        Wallet, VaultTransfer, IndexedBlock,ReceivedTransaction, SentTransaction, 
        Contract, FailedMessage, MessageQueue
        // ,IndexedBlock,ReceivedTransaction
    ],
    synchronize: true,
    logging: false,
})

// to initialize initial connection with the database, register all entities
// and "synchronize" database schema, call "initialize()" method of a newly created database
// once in your application bootstrap
export default AppDataSource;