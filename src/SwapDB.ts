import { EmerisDEXInfo } from "@emeris/types";
export type SwapData = {
	[key in EmerisDEXInfo.DEX]?: EmerisDEXInfo.Swap[]
};

class SwapDB {
	private swaps: SwapData
	private sourceList:string[]=[]
	private loader: ()=>void
	private loadingPromise: Promise<void>
	constructor() {
		this.swaps = {}
		this.loadingPromise = new Promise((resolve) => { this.loader = resolve; });
	}
	setSources(sourceList: string[]) {
		this.sourceList = sourceList;
	}
	update(dex: EmerisDEXInfo.DEX, data: EmerisDEXInfo.Swap[]) {
//		console.log(data);
		this.swaps[dex] = data;
		if (this.sourceList.every((source) => this.swaps[source])) {
			this.loader();
		}
	}
	async get() {
		await this.loadingPromise;
		return Object.values(this.swaps).flat();
	}
	async find(dex: EmerisDEXInfo.DEX, id: string) {
		await this.loadingPromise;
		return this.swaps[dex].find(x => x.name == id);
	}
}
const SwapDBInstance = new SwapDB();
export default SwapDBInstance;