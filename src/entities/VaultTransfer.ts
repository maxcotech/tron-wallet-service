import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { VaultTransferStatuses } from '../config/enums';

@Entity({name:"vault_transfers"})
export default class VaultTransfer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    fromAddress: string;

    @Column()
    vaultAddress: string;

    @Column()
    txId: string;

    @Column()
    value: string; // in tron or token 

    @Column({nullable: true})
    contractId: number; // Id of smart contract if not tron

    @Column({type:'tinyint',default: VaultTransferStatuses.pending})
    status: number;

    @Column()
    retries: number;

    @Column({type:"timestamp", nullable: true})
    retryAt: string;
}