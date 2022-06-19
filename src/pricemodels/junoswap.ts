import { EmerisDEXInfo, EmerisTransactions } from "@emeris/types";
import BigNumber from "bignumber.js";

export function returnAmount(inputCoin: EmerisTransactions.AbstractAmount, pool: EmerisDEXInfo.Swap) {
	let isReverse;
	if (inputCoin.denom === pool.denomA.denom) {
		isReverse = false;
	} else if (inputCoin.denom === pool.denomB.denom) {
		isReverse = true;
	}else {
		throw new Error('Wrong pool');		
	}
	
	const inputAmount = new BigNumber(inputCoin.amount);
	const balanceA = new BigNumber(pool.balanceA);
	const balanceB = new BigNumber(pool.balanceB);
	
	const effectivePrice = isReverse ? balanceB.plus(inputAmount).dividedBy(balanceA) : balanceA.plus(inputAmount).dividedBy(balanceB);
	const effectiveAmount = inputAmount.dividedBy(effectivePrice);
	const returnAmount = effectiveAmount.minus(effectiveAmount.multipliedBy(pool.swapFeeRate));
	const returnDenom = isReverse ? pool.denomA.denom : pool.denomB.denom; 
	return { amount: returnAmount.toString().split('.')[0], denom: returnDenom };
}