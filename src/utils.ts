

import { Coin } from '@cosmjs/amino';
import { bech32 } from 'bech32';

export function toHexString(byteArray) {
	return Array.prototype.map
		.call(byteArray, function (byte) {
			return ('0' + (byte & 0xff).toString(16)).slice(-2);
		})
		.join('');
}
export  function keyHashfromAddress(address: string): string {
	try {
		return toHexString(bech32.fromWords(bech32.decode(address).words));
	} catch (e) {
		throw new Error('Could not decode address');
	}
}
export function fixIBC(denom:string)  {
	return denom.split('/')[0]+'/'+denom.split('/')[1].toUpperCase();
}

export function parseCoins(input: string): Coin[] {
  return input
    .replace(/\s/g, '')
    .split(',')
    .filter(Boolean)
    .map((part) => {
      //eslint-disable-next-line
      const match = part.match(/^([0-9]+)([a-zA-Z0-9\/-]{2,127})$/);
      if (!match) throw new Error('Got an invalid coin string');
      return {
        amount: BigInt(match[1]).toString(),
        denom: match[2],
      };
    });
}