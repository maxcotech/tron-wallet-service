

export const decodeByteValue = (value: any) => {
    const trxAmount = parseInt(value.toString('hex'), 16);
    return trxAmount;
}