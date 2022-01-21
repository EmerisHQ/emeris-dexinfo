import { EmerisDEXInfo } from "@emeris/types";
import axios from "axios";
import { SwapSource } from "./source";
import DenomDB from "../DenomDB";
import BigNumber from "bignumber.js";

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
		
		this.emit('swaps', normalizedSwaps);
	}
	async normalize(swaps) {
		const filtered = swaps.filter(x => x.poolAssets.length == 2);
		const verified_swaps = [];
		let verified_denoms = DenomDB.get();
		for (let i = 0; i < filtered.length; i++) {			
			const reserveA = filtered[i].poolAssets[0].token.denom;
			const reserveB = filtered[i].poolAssets[1].token.denom;
			const balanceA =  filtered[i].poolAssets[0].token.amount;
			const balanceB =  filtered[i].poolAssets[1].token.amount;
			let price = (new BigNumber(filtered[i].poolAssets[1].token.amount)).dividedBy( new BigNumber(filtered[i].poolAssets[0].token.amount)).times( (new BigNumber(filtered[i].poolAssets[0].weight).dividedBy(new BigNumber(filtered[i].poolAssets[1].weight))));
			let traceA, traceB, denomA, denomB = null;
			let valid = true;
			
			if (reserveA.split('/')[0] == 'ibc') {
				traceA = await DenomDB.trace(reserveA, 'osmosis');
				denomA = verified_denoms.find(x => (x.name == traceA.base_denom && x.verified))
				if (!traceA.verified || traceA.trace.length != 1) {
					valid = false;
				}
			} else {
				denomA=verified_denoms.find(x => (x.name == reserveA && x.verified && x.chain_name == 'osmosis'))
				if (!denomA) {
					valid = false;
				}
			}
			if (reserveB.split('/')[0] == 'ibc') {
				traceB = await DenomDB.trace(reserveB, 'osmosis');
				denomB = verified_denoms.find(x => (x.name == traceB.base_denom && x.verified))
				if (!traceB.verified || traceB.trace.length != 1) {
					valid = false;
				}
			} else {
				denomB=verified_denoms.find(x => (x.name == reserveB && x.verified && x.chain_name == 'osmosis'))
				if (!denomB) {
					valid = false;
				}
			}
			if (valid) {
				verified_swaps.push( {
					name: filtered[i].id,
					id: EmerisDEXInfo.DEX.Osmosis+'/'+filtered[i].id,
					chainId: 'osmosis',
					protocol: EmerisDEXInfo.DEX.Osmosis,
					denomA: {
						name: denomA.name,
						displayName: denomA.display_name,
						denom: traceA ?traceA.ibc_denom : denomA.name,
						baseDenom: traceA?traceA.base_denom: denomA.name,
						precision: denomA.precision
					},
					denomB:  {
						name: denomB.name,
						displayName: denomB.display_name,
						denom: traceB ?traceB.ibc_denom : denomB.name,
						baseDenom: traceB?traceB.base_denom: denomB.name,
						precision: denomB.precision
					},
					balanceA,
					balanceB,
					swapPrice: '' + price.times((new BigNumber(10 ** (denomA.precision - denomB.precision)))).toString(),
					swapType: EmerisDEXInfo.SwapType.Pool
				})
			}
		}
		
		return verified_swaps;
	}
}