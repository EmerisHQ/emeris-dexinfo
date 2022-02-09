import { DEX } from "@emeris/types/lib/EmerisDEXInfo";
import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance } from "fastify/types/instance";
import { returnAmount as gravityReturnAmount } from "../pricemodels/gravity";
import { returnAmount as osmosisReturnAmount} from "../pricemodels/osmosis";
import SwapDB from "../SwapDB";

function add(server: FastifyInstance) {
	server.post<{ Body: { inputAmount: { amount: string; denom: string; }; swap_id: string; }; Reply: { amount: string; denom: string;} }>('/price', {
		async handler(request, reply) {
			const protocol = request.body.swap_id.split('/')[0];
			const swap_id = request.body.swap_id.split('/')[1];
			const swap = SwapDB.find(protocol as DEX, swap_id);
			switch (protocol as DEX) {
				case DEX.Gravity:
					reply.send(gravityReturnAmount(request.body.inputAmount, swap));
					break;
				case DEX.Osmosis:
					reply.send(osmosisReturnAmount(request.body.inputAmount, swap));
					break;
			}
		}, 
	}
  );
}
export default { add };
