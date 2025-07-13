import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@clerk/nextjs/server";
import { verifyToken } from '@clerk/backend';
import superjson from "superjson";
import { ZodError } from "zod";
import { supabaseServiceRole } from "@/lib/db/supabase-server";
import type { UserRole } from "@/lib/db/types";
import { randomUUID } from "crypto";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  // Generate or extract correlation ID
  const correlationId = opts.headers.get('x-correlation-id') || randomUUID();
  
  // First try standard Clerk auth (cookie-based)
  let session = await auth();
  let userRole: UserRole | null = null;
  
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
        console.warn('[tRPC] Failed to verify Bearer token:', error);
        console.warn('[tRPC] Token length:', token.length);
        console.warn('[tRPC] JWT Key available:', !!process.env.CLERK_JWT_KEY);
        console.warn('[tRPC] Secret Key available:', !!process.env.CLERK_SECRET_KEY);
      }
    }
  }
  
  // Fetch user role if authenticated
  if (session?.userId) {
    const { data } = await supabaseServiceRole
      .from("user_settings")
      .select("role")
      .eq("user_id", session.userId)
      .single();
    
    userRole = data?.role || null;
  }
  
  return {
    session,
    userRole,
    correlationId,
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
      userRole: ctx.userRole,
      correlationId: ctx.correlationId,
    },
  });
});

const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  
  if (ctx.userRole !== "admin") {
    throw new TRPCError({ 
      code: "FORBIDDEN",
      message: "Admin access required"
    });
  }
  
  return next({
    ctx: {
      session: { ...ctx.session, userId: ctx.session.userId },
      userRole: ctx.userRole,
      correlationId: ctx.correlationId,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
export const adminProcedure = t.procedure.use(enforceUserIsAdmin);