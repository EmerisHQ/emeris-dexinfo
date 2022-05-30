import { EmerisAPI } from '@emeris/types';
import axios, { AxiosResponse } from 'axios';

class DenomDB {
  private denoms: EmerisAPI.VerifiedDenom[];
  private loaded: Promise<boolean>;
  private initializer: (value?: boolean | PromiseLike<boolean>) => void;
  private traces: Map<string, EmerisAPI.VerifyTrace>;

  constructor() {
    this.denoms = [];
    this.loaded = new Promise((resolve) => {
      this.initializer = resolve;
    });
    this.traces = new Map();

    this.init();
  }
  isLoaded() {
    return this.loaded;
  }
  async init() {
    await this.fetchDenoms();
    this.initializer();
    setTimeout(this.fetchDenoms.bind(this), 30000);
  }
  async fetchDenoms() {
    let data: AxiosResponse<EmerisAPI.VerifiedDenomsResponse> = await axios.get(
      'https://api.emeris.com/v1/verified_denoms',
    );
    this.denoms = data.data.verified_denoms;
  }
  get() {
    return this.denoms;
  }
  traceSync(denom: string, chain: string) {
    return this.traces.get(chain + ':' + denom);
  }
  find(baseDenom: string) {
    return this.denoms.find((x) => x.name == baseDenom);
  }
  async trace(denom: string, chain: string) {
    //console.log('just for testing');
    const exists = this.traces.get(chain + ':' + denom);
    if (exists) {
      return exists;
    } else {
      const ibc_hash = denom.split('/')[1];
      try {
        let data: AxiosResponse<EmerisAPI.VerifyTraceResponse> = await axios.get(
          'https://api.emeris.com/v1/chain/' + chain + '/denom/verify_trace/' + ibc_hash,
        );
        this.traces.set(chain + ':' + denom, data.data.verify_trace);
        return data.data.verify_trace;
      } catch (e) {
        return { verified: false };
      }
    }
  }
}
const DenomDBInstance = new DenomDB();
export default DenomDBInstance;
