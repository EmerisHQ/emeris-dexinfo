import { EmerisDEXInfo } from "@emeris/types";
import axios from "axios";
import { SwapSource } from "./source";
import DenomDB from "../DenomDB";

export class OsmosisSource extends SwapSource {
	async realFetch(): Promise<void> {
		let response = await axios.get(this.endpoint + '/osmosis/gamm/v1beta1/pools');
		let swaps = [...response.data.pools]
		while (response.data.pagination.next_key != null) {
			response = await axios.get(this.endpoint + '/osmosis/gamm/v1beta1/pools?pagination.key=' + response.data.pagination.next_key);
			swaps = [...swaps, ...response.data.pools];
		}
		//console.log(JSON.stringify(swaps));
		const normalizedSwaps = await this.normalize(swaps);
		console.log(normalizedSwaps);
		this.emit('swaps', normalizedSwaps);
	}
	async normalize(swaps) {
		const filtered = swaps.filter(x => x.poolAssets.length == 2);
		const verified_swaps = [];
		let verified_denoms = DenomDB.get();
		for (let i = 0; i < filtered.length; i++) {
			const reserveA = filtered[i].poolAssets[0].token.denom;
			const reserveB = filtered[i].poolAssets[1].token.denom;
			let valid = true;
			
			if (reserveA.split('/')[0] == 'ibc') {
				const trace = await DenomDB.trace(reserveA, 'osmosis');
				if (!trace.verified || trace.trace.length != 1) {
					valid = false;
				}
			} else {
				if (!verified_denoms.find(x => (x.name == reserveA && x.verified && x.chain_name == 'osmosis'))) {
					valid = false;
				}
			}
			if (reserveB.split('/')[0] == 'ibc') {
				const trace = await DenomDB.trace(reserveB, 'osmosis');
				if (!trace.verified || trace.trace.length != 1) {
					valid = false;
				}
			} else {
				if (!verified_denoms.find(x => (x.name == reserveB && x.verified && x.chain_name == 'osmosis'))) {
					valid = false;
				}
			}
			if (valid) {
				verified_swaps.push(filtered[i])
			}
		}
		
		return verified_swaps.map(swap => {
			return {
				name: swap.address,
				id: EmerisDEXInfo.DEX.Osmosis+'/'+swap.id,
				chainId: 'osmosis',
				protocol: EmerisDEXInfo.DEX.Osmosis,
				denomA: swap.poolAssets[0].token,
				denomB: swap.poolAssets[1].token,
				swapPrice: '0.00',
				swapType: EmerisDEXInfo.SwapType.Pool
			}
		})
	}
}