import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity({name:"indexed_blocks"})
export default class IndexedBlock {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique:true})
    blockNumber: number;

    @Column({type:"timestamp", nullable: true, default: () => "CURRENT_TIMESTAMP"})
    createdAt: string;

}