import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { MessageTypes } from "../config/enums";

@Entity({name:"message_queue"})
export default class MessageQueue {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({type:"text"})
    message: string;

    @Column({type:"enum", enum: MessageTypes})
    type: number;

    @Column({default: 0})
    retries: number;

    @Column({ type:"timestamp", nullable: true})
    retryAt: string;
    
    @Column({type:"timestamp", default: () => "CURRENT_TIMESTAMP"})
    createdAt: string;

}