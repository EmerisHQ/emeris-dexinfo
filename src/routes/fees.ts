import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance } from "fastify/types/instance";
import { FeesResponse,FeesRequest   } from "@emeris/types/lib/EmerisFees"
import EmerisSigner from '@emeris/signer';
import emerisMapper from '@emeris/mapper';

function add(server: FastifyInstance) {
	server.post<{ Body: FeesRequest; Reply: FeesResponse }>('/fees', {
		async handler(request, reply) {
			const signer = EmerisSigner.withMnemonic(''); //Add mnemonic
			const fees = await signer.getFees(request.body.tx);
			const mapper = new emerisMapper.CosmosAminoMessageMapper('cosmoshub-4');
			mapper.map()
			reply.send({ GasWanted: "1", GasUsed: "2", Fees: []})
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
