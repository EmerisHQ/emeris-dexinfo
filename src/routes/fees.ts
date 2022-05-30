import { FastifyInstance } from 'fastify/types/instance';
import { EmerisFees } from '@emeris/types';
import EmerisSigner from '@emeris/signer';
import emerisMapper from '@emeris/mapper';
import { AminoMsg } from '@cosmjs/amino';
import ChainConfig from '@emeris/chain-config';

function add(server: FastifyInstance) {
  server.post<{ Body: EmerisFees.FeesRequest; Reply: EmerisFees.FeesResponse }>('/fees', {
    async handler(request, reply) {
      const config = new ChainConfig('https://api.emeris.com/v1');
      const fees = [];
      for (const tx of request.body.txs) {
        const chain = await config.getChain(tx.chainName);
        const signer = EmerisSigner.withMnemonic(chain.derivation_path, ''); // MUST ADD MNEMONIC
        const mapped = await emerisMapper(tx);
        fees.push(await signer.getFees({ chain_name: tx.chainName, msgs: mapped as AminoMsg[], memo: '' }));
      }
      reply.send(fees);
    },
    schema: {
      body: EmerisFees.FeesRequest,
      response: {
        '2xx': EmerisFees.FeesResponse,
      },
    },
  });
}
export default { add };
