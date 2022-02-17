import { FastifyInstance } from "fastify/types/instance";
import { EmerisDEXInfo  } from "@emeris/types";
import SwapDB from "../SwapDB";
function add(server: FastifyInstance) {
	server.get('/swaps', {
		handler(_, reply) {
			reply.send({ swaps: SwapDB.get() })
		},
		schema: {
			response: {
				'2xx': EmerisDEXInfo.SwapsResponse
			}
		}
	}
  );
}
export default { add }