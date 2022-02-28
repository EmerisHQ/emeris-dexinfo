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
			const response = [];
			for (const feesRequest of request.body){
				const config = new ChainConfig('https://api.emeris.com/v1')
				const chain = await config.getChain(feesRequest.tx.chainName);
				//TODO: remove mnemonic
				const signer = EmerisSigner.withMnemonic(chain.derivation_path, ''); // MUST ADD MNEMONIC
				const mapped = await emerisMapper(feesRequest.tx);
				const fees = await signer.getFees({ chain_name: feesRequest.tx.chainName, msgs: mapped as AminoMsg[], memo: '' });		
				const { fee, totalUSD } = await FeeService.calculateFees({gasUsed: (fees as any).GasUsed, gasPriceLevel: feesRequest.gasPriceLevel, chain})
				response.push({gasUsed: (fees as any).GasUsed, fee: fee, totalUSD: totalUSD})	
			}
			reply.send(response)
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
