"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createLogger } from "@/lib/logger";

const logger = createLogger("admin");

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the server
    logger.error("Admin page error", { 
      message: error.message,
      stack: error.stack,
      digest: error.digest 
    });
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">Admin Panel Error</h2>
        </div>
        
        <p className="text-gray-600 mb-4">
          There was an error loading the admin panel. This could be due to:
        </p>
        
        <ul className="list-disc list-inside text-sm text-gray-600 mb-4 space-y-1">
          <li>Permission issues</li>
          <li>Database connection problems</li>
          <li>Network connectivity issues</li>
        </ul>
        
        {process.env.NODE_ENV === "development" && (
          <details className="mb-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
              Error details (development only)
            </summary>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
              <code>{error.message}</code>
              {error.stack && (
                <>
                  {"\n\nStack trace:\n"}
                  {error.stack}
                </>
              )}
            </pre>
          </details>
        )}
        
        <div className="flex gap-3">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button onClick={() => window.location.href = "/dashboard"} variant="outline">
            Go to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}