import "@emeris/types";
import { EmerisDEXInfo } from "@emeris/types";
export type SwapData = {
	[key in EmerisDEXInfo.DEX]?: EmerisDEXInfo.Swap[]
};

class SwapDB {
	private swaps:SwapData
	constructor() {
		this.swaps = {}
	}
	update(dex: EmerisDEXInfo.DEX, data: EmerisDEXInfo.Swap[]) {
//		console.log(data);
		this.swaps[dex] = data;
	}
	get() {
		return Object.values(this.swaps).flat();
	}
}
const SwapDBInstance = new SwapDB();
export default SwapDBInstance;