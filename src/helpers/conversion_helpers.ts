

export const decodeByteValue = (value: any) => {
    const trxAmount = parseInt(value.toString('hex'), 16);
    return trxAmount;
}

export const decodeAddressInEvent = (eventAddress: string) => {
    const extractedHex = eventAddress.slice(-40,eventAddress.length);
    const addressInHex = "41"+extractedHex;
    return addressInHex;
}

export const decodeAmountInEvent = (amount: string) => {
    const hexAmount = amount.replace(/^0+/, '');
    return parseInt(hexAmount,16);
}
