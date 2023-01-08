import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity({name:"wallets"})
export default class Wallet {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique:true,length:1000, type: "varchar"})
    address: string;

    @Column({length:10000, type:"varchar"})
    walletCrypt: string;

    @Column({type:"varchar", length: 1000, nullable: true})
    userId: string;  //string form

    @Column({type:"timestamp",nullable: true, default: () => "CURRENT_TIMESTAMP"})
    createdAt: string;
}