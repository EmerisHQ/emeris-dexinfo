import { Amount } from "@emeris/types/lib/EmerisBase";
import { Swap } from "@emeris/types/lib/EmerisDEXInfo";
import BigNumber from "bignumber.js";

export function returnAmount(inputCoin: Amount, pool: Swap) {
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
	const weightingFactor = isReverse ? pool.weightB / pool.weightA : pool.weightA / pool.weightB;
	const effectivePrice = isReverse ? balanceB.plus(inputAmount.multipliedBy(2)).dividedBy(balanceA) : balanceA.plus(inputAmount.multipliedBy(2)).dividedBy(balanceB.multipliedBy(weightingFactor));
	const effectiveAmount = inputAmount.dividedBy(effectivePrice);
	const returnAmount = effectiveAmount.minus(effectiveAmount.multipliedBy(pool.swapFeeRate/ 2));
	const returnDenom = isReverse ? pool.denomA.denom : pool.denomB.denom; 
	return { amount: returnAmount.toString().split('.')[0], denom: returnDenom };
}