import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity({name:"contracts"})
export default class Contract {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique: true})
    tokenId: number;

    @Column({type:"varchar", length: 1000})
    contractName: string;

    @Column({type:"varchar", length: 100})
    contractSymbol: string;

    @Column({type:"varchar", length: 255})
    contractAddress: string;

    @Column({type: "varchar", length:3000, nullable: true})
    contractAbi: string;

    @Column({nullable: true})
    decimalPlaces: number;

    @Column({nullable: true})
    minimumTxnAmount: number;
}