import CryptoJs  from 'crypto-js';
import { ENCRYPTION_SALT } from '../config/settings';

export const encryptValue = (str: string) => {
    const cypherParams = CryptoJs.AES.encrypt(str,ENCRYPTION_SALT ?? "")
    return cypherParams.toString();
}

export const decryptValue = (val: string) => {
    const cypherParams = CryptoJs.AES.decrypt(val,ENCRYPTION_SALT ?? "");
    const decrypted = cypherParams.toString(CryptoJs.enc.Utf8);
    return decrypted;

}

export const encryptObject = (obj: object) => {
    const objectStr = JSON.stringify(obj);
    return encryptValue(objectStr);
}

export const decryptObject = (crypt: string) => {
    const decryptedStr = decryptValue(crypt);
    return JSON.parse(decryptedStr);
}

export const extractObject = (inputObj: any)  => {
    const objectStr = JSON.stringify(inputObj);
    const outObj = JSON.parse(objectStr);
    return outObj;
}