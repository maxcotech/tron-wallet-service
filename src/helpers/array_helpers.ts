

export function sumItemValues<T>(items: T[], property: keyof T){
    let sum = 0;
    items.forEach((item) => {
        let val: any = item[property];
        val = parseFloat(val);
        if(typeof val === "number"){
            sum += val;
        }
    })
    return sum;
}