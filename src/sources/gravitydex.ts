import axios from 'axios';
import { SwapSource } from './source';
import DenomDB from '../DenomDB';
import { EmerisDEXInfo } from '@emeris/types';
import BigNumber from 'bignumber.js';
import { keyHashfromAddress, fixIBC, parseCoins } from '../utils';

export class GravityDexSource extends SwapSource {
  async realFetch(): Promise<void> {
    let response = await axios.get(this.endpoint + '/liquidity/cosmos/liquidity/v1beta1/pools');
    let swaps = [...response.data.pools];
    while (response.data.pagination.next_key != null) {
      response = await axios.get(
        this.endpoint + '/liquidity/cosmos/liquidity/v1beta1/pools?pagination.key=' + response.data.pagination.next_key,
      );
      swaps = [...swaps, ...response.data.pools];
    }
    const normalizedSwaps = await this.normalize(swaps);

    this.emit('swaps', normalizedSwaps);
  }
  async normalize(swaps) {
    const verified_swaps = [];

    const verified_denoms = DenomDB.get();
    for (let i = 0; i < swaps.length; i++) {
      const address = keyHashfromAddress(swaps[i].reserve_account_address);

      const response = await axios.get(this.endpoint + '/account/' + address + '/balance');

      const reserveA = swaps[i].reserve_coin_denoms[0];
      const reserveB = swaps[i].reserve_coin_denoms[1];
      const balances = response.data.balances;
      const balanceA =
        reserveA.split('/')[0] == 'ibc'
          ? balances.find((x) => x.ibc.hash == reserveA.split('/')[1])
          : balances.find((x) => x.base_denom == reserveA);
      const balanceB =
        reserveB.split('/')[0] == 'ibc'
          ? balances.find((x) => x.ibc.hash == reserveB.split('/')[1])
          : balances.find((x) => x.base_denom == reserveB);
      const amountA = parseCoins(balanceA.amount)[0].amount;
      const amountB = parseCoins(balanceB.amount)[0].amount;
      const price = new BigNumber(amountB).dividedBy(new BigNumber(amountA));
      let traceA,
        traceB,
        denomA,
        denomB = null;
      let valid = true;

      if (reserveA.split('/')[0] == 'ibc') {
        traceA = await DenomDB.trace(reserveA, 'cosmos-hub');
        denomA = verified_denoms.find((x) => x.name == traceA.base_denom && x.verified);
        if (!traceA.verified || traceA.trace.length != 1) {
          valid = false;
        }
      } else {
        denomA = verified_denoms.find((x) => x.name == reserveA && x.verified && x.chain_name == 'cosmos-hub');
        if (!denomA) {
          valid = false;
        }
      }
      if (reserveB.split('/')[0] == 'ibc') {
        traceB = await DenomDB.trace(reserveB, 'cosmos-hub');
        denomB = verified_denoms.find((x) => x.name == traceB.base_denom && x.verified);
        if (!traceB.verified || traceB.trace.length != 1) {
          valid = false;
        }
      } else {
        denomB = verified_denoms.find((x) => x.name == reserveB && x.verified && x.chain_name == 'cosmos-hub');
        if (!denomB) {
          valid = false;
        }
      }
      if (valid) {
        verified_swaps.push({
          name: swaps[i].id,
          id: EmerisDEXInfo.DEX.Gravity + '/' + swaps[i].id,
          chainId: 'cosmos-hub',
          protocol: EmerisDEXInfo.DEX.Gravity,
          denomA: {
            name: denomA.name,
            displayName: denomA.display_name,
            denom: traceA ? fixIBC(traceA.ibc_denom) : denomA.name,
            baseDenom: traceA ? traceA.base_denom : denomA.name,
            precision: denomA.precision,
          },
          denomB: {
            name: denomB.name,
            displayName: denomB.display_name,
            denom: traceB ? fixIBC(traceB.ibc_denom) : denomB.name,
            baseDenom: traceB ? traceB.base_denom : denomB.name,
            precision: denomB.precision,
          },
          balanceA: amountA,
          balanceB: amountB,
          weightA: 0.5,
          weightB: 0.5,
          swapPrice: '' + price.times(new BigNumber(10 ** (denomA.precision - denomB.precision))).toString(),
          swapFeeRate: 0.003,
          swapType: EmerisDEXInfo.SwapType.Pool,
        });
      }
    }

    return verified_swaps;
  }
}
