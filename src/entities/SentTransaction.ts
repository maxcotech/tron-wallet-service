import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity({name:"sent_transactions"})
export default class SentTransaction {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({type:"varchar",length: 1000,unique: true})
    txId: string;

    @Column({default: false})
    confirmed: boolean;

    @Column({type:"timestamp", default:() => "CURRENT_TIMESTAMP", nullable: true})
    createdAt: string;

}
