import { EmerisDEXInfo } from "@emeris/types";
import { FastifyInstance } from "fastify/types/instance";
import { returnAmount as gravityReturnAmount } from "../pricemodels/gravity";
import { returnAmount as osmosisReturnAmount} from "../pricemodels/osmosis";
import { returnAmount as crescentReturnAmount} from "../pricemodels/crescent";
import SwapDB from "../SwapDB";

function add(server: FastifyInstance) {
	server.post<{ Body: { inputAmount: { amount: string; denom: string; }; swap_id: string; }; Reply: { amount: string; denom: string;} }>('/price', {
		async handler(request, reply) {
			const protocol = request.body.swap_id.split('/')[0];
			const swap_id = request.body.swap_id.split('/')[1];
			const swap = await SwapDB.find(protocol as EmerisDEXInfo.DEX, swap_id);
			switch (protocol as EmerisDEXInfo.DEX) {
				case EmerisDEXInfo.DEX.Gravity:
					reply.send(gravityReturnAmount(request.body.inputAmount, swap));
					break;
				case EmerisDEXInfo.DEX.Osmosis:
					reply.send(osmosisReturnAmount(request.body.inputAmount, swap));
					break;
				case EmerisDEXInfo.DEX.Crescent:
					reply.send(crescentReturnAmount(request.body.inputAmount, swap));
					break;
			}
		}, 
	}
  );
}
export default { add };
