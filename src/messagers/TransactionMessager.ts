import Messager from "./Messager";


export default class TransactionMessager extends Messager{
    async sendNewCreditTransaction(message: any){
        console.log("broadcasting....", message);
    }
}