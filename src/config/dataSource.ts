import "reflect-metadata"
import { DataSource } from "typeorm"
import Wallet from './../entities/Wallet';
import IndexedBlock from './../entities/IndexedBlock';
import ReceivedTransaction from "../entities/ReceivedTransaction";

const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "",
    database: "tron_wallet_service",
    entities: [Wallet
        // ,IndexedBlock,ReceivedTransaction
    ],
    synchronize: true,
    logging: false,
})

// to initialize initial connection with the database, register all entities
// and "synchronize" database schema, call "initialize()" method of a newly created database
// once in your application bootstrap
export default AppDataSource;