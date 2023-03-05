import AppDataSource from "../config/dataSource";
import { HttpRequestParams } from "../dataTypes/Http";
import Contract from "../entities/Contract";
import Controller from "./Controller";
import ValidationException from './../exceptions/ValidationException';
import { ContractErrors } from './../config/errors/contract.errors';

export default class ContractController extends Controller {

    public static async saveContract({req}: HttpRequestParams){
        const {contractAddress, contractName, contractSymbol, decimalPlaces = 6, contractAbi = null} = req.body ?? {};
        if(!!contractAddress === false) throw new ValidationException(ContractErrors.invalidContractAddress);
        if(!!contractName === false) throw new ValidationException(ContractErrors.invalidContractName);
        if(!!contractSymbol === false) throw new ValidationException(ContractErrors.invalidContractSymbol);
        if(!!decimalPlaces === false || isNaN(decimalPlaces) === true) throw new ValidationException(ContractErrors.invalidDecimalPlaces);
        const contractRepo = AppDataSource.getRepository(Contract);
        const existing = await contractRepo.findOneBy({contractAddress});
        if(!!existing){
            return await contractRepo.update({contractAddress},{contractAddress,contractName,contractSymbol,contractAbi,decimalPlaces})
        } else {
            const contract = new Contract();
            contract.contractAbi = contractAbi;
            contract.contractAddress = contractAddress;
            contract.contractName = contractName;
            contract.contractSymbol = contractSymbol;
            contract.decimalPlaces = decimalPlaces;
            return await contractRepo.save(contract);
        }

    }

    public static async deleteContract({req}: HttpRequestParams){
        const {address} = req.params ?? {};
        if(!!address === false) throw new ValidationException(ContractErrors.invalidContractAddress);
        const contractRepo = AppDataSource.getRepository(Contract);
        return await contractRepo.delete({contractAddress: address})
    }
}