import { EmerisDEXInfo } from "@emeris/types";
import axios from "axios";
import { SwapSource } from "./source";

export class OsmosisSource extends SwapSource {
	async realFetch(): Promise<void> {
		let response = await axios.get(this.endpoint + '/osmosis/gamm/v1beta1/pools');
		let swaps = [...response.data.pools]
		while (response.data.pagination.next_key != null) {
			response = await axios.get(this.endpoint + '/osmosis/gamm/v1beta1/pools?pagination.key=' + response.data.pagination.next_key);
			swaps = [...swaps, ...response.data.pools];
		}
		console.log(JSON.stringify(swaps));
		const normalizedSwaps = await this.normalize(swaps);
	//	console.log(normalizedSwaps);
		this.emit('swaps', normalizedSwaps);
	}
	async normalize(swaps) {
		const filtered = swaps.filter(x => x.poolAssets.length == 2);
		return filtered.map(swap => {
			return {
				name: swap.address,
				id: swap.id,
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