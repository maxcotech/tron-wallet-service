import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: "received_transactions" })
export default class ReceivedTransaction {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 2000, type: "varchar" })
    txId: string;

    @Column({ length: 1000 })
    address: string;

    @Column({ type: "varchar", length: "1000", nullable: true })
    value: string;  // in tron or token

    @Column({ nullable: true })
    contractId: number;

    @Column({ type: "boolean", default: false })
    sentToVault: boolean;

    @Column({ type: "boolean", default: false })
    confirmed: boolean;

    @Column({ nullable: true, type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt: string;


}
