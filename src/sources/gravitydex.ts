import axios from "axios";
import { SwapSource } from "./source";
import DenomDB from "../DenomDB";
import { EmerisDEXInfo } from "@emeris/types";

export class GravityDexSource extends SwapSource {
	async realFetch(): Promise<void> {
		let response = await axios.get(this.endpoint + '/cosmos/liquidity/v1beta1/pools');
		let swaps = [...response.data.pools]
		while (response.data.pagination.next_key != null) {
			response = await axios.get(this.endpoint + '/cosmos/liquidity/v1beta1/pools?pagination.key=' + response.data.pagination.next_key);
			swaps = [...swaps, ...response.data.pools];
		}
		const normalizedSwaps = await this.normalize(swaps);
		console.log(normalizedSwaps);
		this.emit('swaps', normalizedSwaps);
	}
	async normalize(swaps) {		
		const verified_swaps = [];
		let verified_denoms = DenomDB.get();
		for (let i = 0; i < swaps.length; i++) {
			const reserveA = swaps[i].reserve_coin_denoms[0];
			const reserveB = swaps[i].reserve_coin_denoms[1];
			let valid = true;
			
			if (reserveA.split('/')[0] == 'ibc') {
				const trace = await DenomDB.trace(reserveA, 'cosmos-hub');
				if (!trace.verified || trace.trace.length != 1) {
					valid = false;
				}
			} else {
				if (!verified_denoms.find(x => (x.name == reserveA && x.verified && x.chain_name == 'cosmos-hub'))) {
					valid = false;
				}
			}
			if (reserveB.split('/')[0] == 'ibc') {
				const trace = await DenomDB.trace(reserveB, 'cosmos-hub');
				if (!trace.verified || trace.trace.length != 1) {
					valid = false;
				}
			} else {
				if (!verified_denoms.find(x => (x.name == reserveB && x.verified && x.chain_name == 'cosmos-hub'))) {
					valid = false;
				}
			}
			if (valid) {
				verified_swaps.push(swaps[i])
			}
		}
		
		return verified_swaps.map(swap => {
			return {
				name: swap.id,
				id: EmerisDEXInfo.DEX.Gravity+'/'+swap.id,
				chainId: 'cosmos-hub',
				protocol: EmerisDEXInfo.DEX.Gravity,
				denomA: swap.reserve_coin_denoms[0],
				denomB: swap.reserve_coin_denoms[1],
				swapPrice: '0.00',
				swapType: EmerisDEXInfo.SwapType.Pool
			}
		})
	}
}