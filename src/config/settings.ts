import { config } from "dotenv";
config();

export const GB_API_KEY = process.env.GB_API_KEY ?? "";
export const VAULT_ADDRESS = process.env.VAULT_ADDRESS ?? "";
export const DECIMAL_PLACES = process.env.DECIMAL_PLACES ?? 18;
export const ENCRYPTION_SALT = process.env.ENCRYPTION_SALT ?? "";
export const ENCRYPTION_PASSPHRASE = process.env.ENCRYPTION_PASSPHRASE ?? "";
export const VAULT_PRIV_KEY = process.env.VAULT_PRIV_KEY ?? "";
export const CLIENT_AUTH = process.env.CLIENT_AUTH ?? ""; 
export const FAILED_MESSAGE_MAX_RETRIAL = process.env.FAILED_MESSAGE_MAX_RETRIAL ?? 1000;
export const WALLET_DEFAULT_SYMBOL = process.env.WALLET_DEFAULT_SYMBOL ?? "TRX";