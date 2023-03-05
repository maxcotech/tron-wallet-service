export default class AppException extends Error {
    
    errorCode: number = 500;
    constructor(msg: string, code: number = 500) {
        super(msg);
        this.errorCode = code;
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, AppException.prototype);
    }

    getErrorCode(){
        return this.errorCode;
    }
}