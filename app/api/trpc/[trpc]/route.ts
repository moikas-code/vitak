import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";
import { appRouter } from "@/lib/trpc/root";
import { createTRPCContext } from "@/lib/trpc/trpc";
import { createLogger } from "@/lib/logger";

const logger = createLogger('trpc-handler');

const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError: ({ path, error, type, ctx, input }) => {
      const correlationId = crypto.randomUUID();
      const errorDetails = {
        correlationId,
        path: path ?? "<no-path>",
        type,
        code: error.code,
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        input: process.env.NODE_ENV === "development" ? input : undefined,
        userId: ctx?.session?.userId,
        timestamp: new Date().toISOString(),
      };

      // Always log errors with structured logging
      logger.error(`tRPC error on ${path ?? "<no-path>"}`, errorDetails);

      // In development, also console.error for visibility
      if (process.env.NODE_ENV === "development") {
        console.error(
          `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
          errorDetails
        );
      }
    },
  });

export { handler as GET, handler as POST };