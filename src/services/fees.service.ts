import { EmerisFees } from "@emeris/types";
import axios from "axios";
import BigNumber from "bignumber.js";

export default class FeeService {
    static async calculateFees({gasUsed, gasPriceLevel, chain}){
        try{
            const inputGasPriceLevel = gasPriceLevel ? gasPriceLevel : EmerisFees.GasPriceLevel.Average;
            const denom = chain?.denoms?.find((denom) => !!denom.fee_token);
            const feeAmount = new BigNumber(gasUsed).multipliedBy((denom as any).gas_price_levels[inputGasPriceLevel]).toNumber();
            const prices = await axios.get('https://api.emeris.com/v1/oracle/prices');
            const unitPriceTokenUSD = prices.data.data.Tokens.find((token) => token?.Symbol === `${(denom as any).ticker}USDT`)?.Price
            const totalUSD = new BigNumber(feeAmount).multipliedBy(unitPriceTokenUSD).shiftedBy(-denom.precision).decimalPlaces(denom.precision).toNumber();
            const fee = [{amount: feeAmount, denom: (denom as any).name}]
            return { fee, totalUSD }
        } catch (e){
            throw new Error("Could not calculate fee: "+ e);
        }
        
    }
}