import AppException from './AppException';

export default class ValidationException extends AppException {
    constructor(msg: string, code: number = 422) {
        super(msg,code);
    }
}