import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance } from "fastify/types/instance";
import { SwapsResponse  } from "@emeris/types/lib/EmerisDEXInfo";
import SwapDB from "../SwapDB";
function add(server: FastifyInstance) {
	server.get('/swaps', {
		handler(_, reply) {
			reply.send({ swaps: SwapDB.get() })
		},
		schema: {
			response: {
				'2xx': SwapsResponse
			}
		}
	}
  );
}
export default { add }