
export const subtractPercentage = (percentage: number,amount: number) => {
    const pvalue = (percentage / 100) * amount;
    return (amount - pvalue);
}




