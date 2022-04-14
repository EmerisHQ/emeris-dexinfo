import axios from "axios";
import { SwapSource } from "./source";
import DenomDB from "../DenomDB";
import { EmerisDEXInfo } from "@emeris/types";
import BigNumber from "bignumber.js";
import { keyHashfromAddress, fixIBC, parseCoins } from "../utils";


export class CrescentSource extends SwapSource {
	private pools;
	async realFetch(): Promise<void> {
		
		let response = await axios.get(this.endpoint + '/crescent/liquidity/v1beta1/pairs');
		let swaps = [...response.data.pairs]
		while (response.data.pagination.next_key != null) {
			response = await axios.get(this.endpoint + '/crescent/liquidity/v1beta1/pairs?pagination.key=' + response.data.pagination.next_key);
			swaps = [...swaps, ...response.data.pairs];
		}
		response = await axios.get(this.endpoint + '/crescent/liquidity/v1beta1/pools');
		let pools = [...response.data.pools]
		while (response.data.pagination.next_key != null) {
			response = await axios.get(this.endpoint + '/crescent/liquidity/v1beta1/pools?pagination.key=' + response.data.pagination.next_key);
			pools = [...pools, ...response.data.pools];
		}
		this.pools = pools;
		
		const normalizedSwaps = await this.normalize(swaps);

		this.emit('swaps', normalizedSwaps);
	}
	getPool(pair_id) {
		return this.pools.find(x => x.pair_id == pair_id);
	}
	async normalize(swaps) {
		const verified_swaps = [];
		
		let verified_denoms = DenomDB.get();
		for (let i = 0; i < swaps.length; i++) {
			const pool = this.getPool(swaps[i].id);		
			
			const reserveA = swaps[i].base_coin_denom;
			const reserveB = swaps[i].quote_coin_denom;
			const balances = pool.balances;
			const balanceA = balances.find(x => x.denom == reserveA)
			const balanceB = balances.find(x => x.denom == reserveB)
			const amountA = balanceA.amount;
			const amountB = balanceB.amount;
			
			let traceA, traceB, denomA, denomB = null;
			let valid = true;
			let price = (new BigNumber(amountB)).dividedBy(new BigNumber(amountA));
			if (reserveA.split('/')[0] == 'ibc') {
				traceA = await DenomDB.trace(reserveA, 'crescent');				
				denomA = verified_denoms.find(x => (x.name == traceA.base_denom && x.verified))
				if (!traceA.verified || traceA.trace.length != 1) {
					valid = false;
				}
			} else {
				denomA = verified_denoms.find(x => (x.name == reserveA && x.verified && x.chain_name == 'crescent'))
				if (!denomA) {
					valid = false;
				}
			}
			if (reserveB.split('/')[0] == 'ibc') {
				traceB = await DenomDB.trace(reserveB, 'crescent');
				denomB = verified_denoms.find(x => (x.name == traceB.base_denom && x.verified))
				if (!traceB.verified || traceB.trace.length != 1) {
					valid = false;
				}
			} else {
				denomB = verified_denoms.find(x => (x.name == reserveB && x.verified && x.chain_name == 'crescent'))
				if (!denomB) {
					valid = false;
				}
			}
			console.log(traceA);
			console.log(traceB);
			console.log(denomA);
			console.log(denomB);
			/*
			console.log({
				name: swaps[i].id,
				id: EmerisDEXInfo.DEX.Crescent + '/' + swaps[i].id,
				chainId: 'crescent',
				protocol: EmerisDEXInfo.DEX.Crescent,
				denomA: {
					name: denomA.name,
					displayName: denomA.display_name,
					denom: traceA ? fixIBC(traceA.ibc_denom) : denomA.name,
					baseDenom: traceA ? traceA.base_denom : denomA.name,
					precision: denomA.precision
				},
				denomB: {
					name: denomB.name,
					displayName: denomB.display_name,
					denom: traceB ? fixIBC(traceB.ibc_denom) : denomB.name,
					baseDenom: traceB ? traceB.base_denom : denomB.name,
					precision: denomB.precision
				},
				balanceA: amountA,
				balanceB: amountB,
				weightA: 0.5,
				weightB: 0.5,
				swapPrice: '' + price.times((new BigNumber(10 ** (denomA.precision - denomB.precision)))).toString(),
				swapFeeRate: 0,
				swapType: EmerisDEXInfo.SwapType.Pool
			}); */
			if (valid) {
				verified_swaps.push({
					name: swaps[i].id,
					id: EmerisDEXInfo.DEX.Crescent + '/' + swaps[i].id,
					chainId: 'crescent',
					protocol: EmerisDEXInfo.DEX.Crescent,
					denomA: {
						name: denomA.name,
						displayName: denomA.display_name,
						denom: traceA ? fixIBC(traceA.ibc_denom) : denomA.name,
						baseDenom: traceA ? traceA.base_denom : denomA.name,
						precision: denomA.precision
					},
					denomB: {
						name: denomB.name,
						displayName: denomB.display_name,
						denom: traceB ? fixIBC(traceB.ibc_denom) : denomB.name,
						baseDenom: traceB ? traceB.base_denom : denomB.name,
						precision: denomB.precision
					},
					balanceA: amountA,
					balanceB: amountB,
					weightA: 0.5,
					weightB: 0.5,
					swapPrice: '' + price.times((new BigNumber(10 ** (denomA.precision - denomB.precision)))).toString(),
					swapFeeRate: 0,
					swapType: EmerisDEXInfo.SwapType.Pool
				})
			}
		}

		return verified_swaps;
	}
}