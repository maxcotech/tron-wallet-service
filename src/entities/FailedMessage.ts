import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { MessageTypes } from "../config/enums";

@Entity({name:"failed_messages"})
export default class FailedMessage {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({type:"json"})
    message: string;

    @Column({type:"enum", enum: MessageTypes})
    type: number;
    
    @Column({type:"timestamp", default: () => "CURRENT_TIMESTAMP"})
    createdAt: string;
}