import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name:"spent_inputs"})
export default class SpentInput {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    inputId: number;

    @Column()
    txId: number;

    @Column({type:"timestamp", default: () => "CURRENT_TIMESTAMP"})
    createdAt: string;

}