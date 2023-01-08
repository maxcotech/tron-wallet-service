
import { btcToSatoshi } from './conversions';

describe("Conversions Module",() => {
    test("2 btc is 20000000 in satoshi",() => {
        expect(btcToSatoshi(2)).toBe(20000000) 
    })
})