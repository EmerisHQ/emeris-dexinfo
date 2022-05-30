import { FastifyInstance } from 'fastify/types/instance';
import { EmerisDEXInfo } from '@emeris/types';
import SwapDB from '../SwapDB';
function add(server: FastifyInstance) {
  server.get('/swaps', {
    async handler(_, reply) {
      reply.send({ swaps: await SwapDB.get() });
    },
    schema: {
      response: {
        '2xx': EmerisDEXInfo.SwapsResponse,
      },
    },
  });
}
export default { add };
