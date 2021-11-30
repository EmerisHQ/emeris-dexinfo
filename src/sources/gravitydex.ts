import axios from "axios";
import { SwapSource } from "./source";

export class GravityDexSource extends SwapSource {
	async realFetch(): Promise<void> {
		let response = await axios.get(this.endpoint + '/cosmos/liquidity/v1beta1/pools');
		let swaps = [...response.data.pools]
		while (response.data.pagination.next_key != null) {
			response = await axios.get(this.endpoint + '/cosmos/liquidity/v1beta1/pools?pagination.key=' + response.data.pagination.next_key);
			swaps = [...swaps, ...response.data.pools];
		}
		const normalizedSwaps = swaps;
		
		this.emit('swaps', normalizedSwaps);
	}
}