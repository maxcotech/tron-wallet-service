import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { MessageTypes } from "../config/enums";

@Entity({name:"failed_queue_messages"})
export default class FailedQueueMessage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    messageId:  number;
    
    @Column({type:"text"})
    message: string;

    @Column({type:"enum", enum: MessageTypes})
    type: number;

    @Column()
    retried: number;
    
    @Column({type:"timestamp", default: () => "CURRENT_TIMESTAMP"})
    createdAt: string;

}