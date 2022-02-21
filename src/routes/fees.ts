import { FastifyInstance } from "fastify/types/instance";
import { FeesResponse, FeesRequest } from "@emeris/types/lib/EmerisFees"
import EmerisSigner from '@emeris/signer';
import emerisMapper from '@emeris/mapper';
import { AminoMsg } from "@cosmjs/amino";
import ChainConfig from "../chainConfig";
import FeeService from '../services/fees.service'

function add(server: FastifyInstance) {
	server.post<{ Body: FeesRequest; Reply: FeesResponse }>('/fees', {
		async handler(request, reply) {
			const config = new ChainConfig('https://api.emeris.com/v1')
			const chain = await config.getChain(request.body.tx.chainName);
			//TODO: remove mnemonic
			const signer = EmerisSigner.withMnemonic(chain.derivation_path, ''); // MUST ADD MNEMONIC
			const mapped = await emerisMapper(request.body.tx);
			const fees = await signer.getFees({ chain_name: request.body.tx.chainName, msgs: mapped as AminoMsg[], memo: '' });		
			const { fee, totalUSD } = await FeeService.calculateFees({gasUsed: (fees as any).GasUsed, gasPriceLevel: request?.body?.gasPriceLevel, chain})
			reply.send({gasUsed: (fees as any).GasUsed, fee: fee, totalUSD: totalUSD} as any)
		}, 
		schema: {
			body: FeesRequest,
			response: {
				'2xx': FeesResponse
			}
		}
	}
  );
}
export default { add };
