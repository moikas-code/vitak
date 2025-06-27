import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@clerk/nextjs/server";
import { verifyToken } from '@clerk/backend';
import superjson from "superjson";
import { ZodError } from "zod";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  // First try standard Clerk auth (cookie-based)
  let session = await auth();
  
  // If no session from cookies, check for Bearer token
  if (!session?.userId) {
    const authorization = opts.headers.get('authorization');
    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.slice(7);
      try {
        // Verify the token with Clerk
        const jwt_payload = await verifyToken(token, {
          jwtKey: process.env.CLERK_JWT_KEY || process.env.CLERK_SECRET_KEY,
          authorizedParties: process.env.CLERK_AUTHORIZED_PARTIES?.split(',') || [],
        });
        if (jwt_payload && jwt_payload.sub) {
          // Create a session-like object from the JWT
          session = {
            userId: jwt_payload.sub,
            sessionId: jwt_payload.sid || '',
            sessionClaims: jwt_payload,
          } as typeof session;
        }
      } catch (error) {
        console.warn('Failed to verify Bearer token:', error);
      }
    }
  }
  
  return {
    session,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, userId: ctx.session.userId },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);