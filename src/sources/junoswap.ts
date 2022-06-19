import { EmerisDEXInfo } from "@emeris/types";
import axios from "axios";
import { SwapSource } from "./source";
import DenomDB from "../DenomDB";
import BigNumber from "bignumber.js";
import { fixIBC } from "../utils";

export class JunoswapSource extends SwapSource {
	async realFetch(): Promise<void> {
		let response = await axios.get(this.endpoint);
		console.log(response.data)
		let swaps = [...response.data.pools]
		const normalizedSwaps = await this.normalize(swaps);
		this.emit('swaps', normalizedSwaps);
	}
	async normalize(swaps) {
		const verified_swaps = [];
		let verified_denoms = DenomDB.get();
		for (let i = 0; i < swaps.length; i++) {
            const pool = swaps[i];

			// fetch pool details
			const poolAddress = pool.swap_address;
			let response = await axios.get(
				'https://api.emeris.com/v1/chain/juno/lcd/cosmos/bank/v1beta1/balances/' + poolAddress
			);

			const reserveA = response.data.balances[0].denom;
			const reserveB = response.data.balances[1].denom;
			const balanceA =  response.data.balances[0].amount;
			const balanceB =  response.data.balances[1].amount;
 			const weightA = 0.5;
			const weightB = 0.5;

			let price = "-1";

			let traceA, traceB, denomA, denomB = null;
			let valid = true;

            denomA=verified_denoms.find(x => (x.name == reserveA && x.verified && x.chain_name == 'junoswap'))
            if (!denomA) {
                valid = false;
            }
			if (reserveB.split('/')[0] == 'ibc') {
				traceB = await DenomDB.trace(reserveB, 'junoswap');
				denomB = verified_denoms.find(x => (x.name == traceB.base_denom && x.verified))
				if (!traceB.verified || traceB.trace.length != 1) {
					valid = false;
				}
			} else {
				denomB=verified_denoms.find(x => (x.name == reserveB && x.verified && x.chain_name == 'junoswap'))
				if (!denomB) {
					valid = false;
				}
			}
			if (valid) {
				verified_swaps.push( {
					name: "junoswap_" + reserveA + "_" + reserveB,
					id: EmerisDEXInfo.DEX.Junoswap+'/'+i,
					chainId: 'junoswap',
					protocol: EmerisDEXInfo.DEX.Junoswap,
					denomA: {
						name: denomA.name,
						displayName: denomA.display_name,
						denom: traceA ? fixIBC(traceA.ibc_denom) : denomA.name,
						baseDenom: traceA?traceA.base_denom: denomA.name,
						precision: denomA.precision
					},
					denomB:  {
						name: denomB.name,
						displayName: denomB.display_name,
						denom: traceB ? fixIBC(traceB.ibc_denom) : denomB.name,
						baseDenom: traceB?traceB.base_denom: denomB.name,
						precision: denomB.precision
					},
					balanceA,
					balanceB,
					weightA,
					weightB,
					swapPrice: '' + price,
					swapFeeRate: 0,
					swapType: EmerisDEXInfo.SwapType.Pool
				})
			}
		}

		return verified_swaps;
	}
}
