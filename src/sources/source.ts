import { EventEmitter } from "events";
export abstract class SwapSource extends EventEmitter{
	endpoint: string;
	autoUpdate: boolean;
	timeOut: number;

	constructor(endpoint: string, autoUpdate: boolean, timeOut: number) {
		super();
		this.endpoint = endpoint;
		this.autoUpdate = autoUpdate;
		this.timeOut = timeOut;
		this.fetch();
	}
	async fetch(): Promise<void> {
		try {
			await this.realFetch()	
		}catch(e) {
			console.log(e);
		}
		if (this.autoUpdate) {			
			setTimeout(this.fetch.bind(this), this.timeOut)
		}
	}
	abstract realFetch(): void;

}