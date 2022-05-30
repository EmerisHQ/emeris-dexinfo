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
	const balanceA = isReverse ? new BigNumber(pool.balanceB) : new BigNumber(pool.balanceA);
	const balanceB = isReverse ? new BigNumber(pool.balanceA) : new BigNumber(pool.balanceB);
	const returnAmount = inputAmount.multipliedBy(balanceA).multipliedBy(balanceB).dividedBy(inputAmount.plus(balanceA).pow(2))
	const returnDenom = isReverse ? pool.denomA.denom : pool.denomB.denom;
	return { amount: returnAmount.toString().split('.')[0], denom: returnDenom };
}
