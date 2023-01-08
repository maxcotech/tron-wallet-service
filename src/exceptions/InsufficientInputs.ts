export default class InsufficientInputs extends Error {
    constructor(msg: string) {
        super(msg);
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, InsufficientInputs.prototype);
    }

    getErrorCode(){
        return 500;
    }
}