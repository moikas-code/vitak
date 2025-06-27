"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink, TRPCLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import superjson from "superjson";
import { observable } from "@trpc/server/observable";
import { type AppRouter } from "@/lib/trpc/root";

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Optimize for PWA/mobile usage
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors except 429 (rate limit)
        const httpStatus = (error as { data?: { httpStatus?: number } })?.data?.httpStatus;
        if (httpStatus && httpStatus >= 400 && httpStatus < 500 && httpStatus !== 429) {
          return false;
        }
        // Retry up to 3 times with exponential backoff
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Enable offline support
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: (failureCount, error: unknown) => {
        // Don't retry mutations on 4xx errors except 429
        const httpStatus = (error as { data?: { httpStatus?: number } })?.data?.httpStatus;
        if (httpStatus && httpStatus >= 400 && httpStatus < 500 && httpStatus !== 429) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      networkMode: 'offlineFirst',
    },
  },
});

let clientQueryClientSingleton: QueryClient | undefined = undefined;

const getQueryClient = () => {
  if (typeof window === "undefined") {
    return createQueryClient();
  }
  return (clientQueryClientSingleton ??= createQueryClient());
};

// Custom retry link for tRPC
const retryLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      let attempts = 0;
      const maxRetries = op.type === 'mutation' ? 2 : 3;
      
      const attemptRequest = () => {
        attempts++;
        
        next(op).subscribe({
          next: (result) => observer.next(result),
          error: (error) => {
            // Don't retry on 4xx errors except 429
            const httpStatus = error?.data?.httpStatus;
            if (httpStatus && httpStatus >= 400 && httpStatus < 500 && httpStatus !== 429) {
              observer.error(error);
              return;
            }
            
            if (attempts < maxRetries) {
              const delay = Math.min(1000 * 2 ** (attempts - 1), 10000);
              setTimeout(attemptRequest, delay);
            } else {
              observer.error(error);
            }
          },
          complete: () => observer.complete(),
        });
      };
      
      attemptRequest();
    });
  };
};

export const api = createTRPCReact<AppRouter>();

export function TRPCProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        retryLink,
        httpBatchLink({
          transformer: superjson,
          url: getBaseUrl() + "/api/trpc",
          headers: async () => {
            const headers = new Headers();
            headers.set("x-trpc-source", "nextjs-react");
            
            // Authentication headers are handled by Clerk middleware on the server
            // No need to manually add them here
            
            return headers;
          },
          fetch: (url, options) => {
            // Enhanced fetch with timeout and better error handling for PWA
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
            
            return fetch(url, {
              ...options,
              signal: controller.signal,
            }).finally(() => {
              clearTimeout(timeoutId);
            });
          },
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}