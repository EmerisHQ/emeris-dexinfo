import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance } from "fastify/types/instance";

const HealthResponse = Type.Object({
  time: Type.String({ format: "date-time" }),
});
type HealthResponseType = Static<typeof HealthResponse>;

function add(server: FastifyInstance) {
  server.get<{ Reply: HealthResponseType }>(
    "/-/health",
    {
      schema: {
        tags: ["health"],
        response: {
          200: HealthResponse,
        },
      },
    },
    async () => {
      return {
        time: new Date().toISOString(),
      };
    }
  );
}
export default { add };