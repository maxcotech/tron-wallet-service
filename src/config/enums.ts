export enum ContractTypes {
  AccountCreateContract, // = 0,
  TransferContract = "TransferContract", // = 1,
  TransferAssetContract = "TransferAssetContract", // = 2,
  VoteAssetContract = 3,
  VoteWitnessContract = 4,
  WitnessCreateContract = 5,
  AssetIssueContract = 6,
  WitnessUpdateContract = 8,
  ParticipateAssetIssueContract = 9,
  AccountUpdateContract = 10,
  FreezeBalanceContract = 11,
  UnfreezeBalanceContract = 12,
  WithdrawBalanceContract = 13,
  UnfreezeAssetContract = 14,
  UpdateAssetContract = 15,
  ProposalCreateContract = 16,
  ProposalApproveContract = 17,
  ProposalDeleteContract = 18,
  SetAccountIdContract = 19,
  CustomContract = 20,
  CreateSmartContract = 30,
  TriggerSmartContract = "TriggerSmartContract",
  GetContract = 32,
  UpdateSettingContract = 33,
  ExchangeCreateContract = 41,
  ExchangeInjectContract = 42,
  ExchangeWithdrawContract = 43,
  ExchangeTransactionContract = 44,
  UpdateEnergyLimitContract = 45,
  AccountPermissionUpdateContract = 46,
  ClearABIContract = 48,
  UpdateBrokerageContract = 49,
  ShieldedTransferContract = 51,
  MarketSellAssetContract = 52,
  MarketCancelOrderContract = 53,
}

export enum MessageTypes {
  creditTransaction,
  debitTransaction,
  feeCredit
}

export enum VaultTransferStatuses {
  pending = 0,
  processing = 1,
  completed = 2,
  failed = 3,
  cancelled = 4
}

