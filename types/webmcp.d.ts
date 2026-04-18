/**
 * Type declarations for the WebMCP API (experimental)
 * @see https://webmachinelearning.github.io/webmcp/
 * @see https://developer.chrome.com/blog/webmcp-epp
 */

interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

interface ModelContextApi {
  provideContext: (context: {
    tools: WebMcpTool[];
  }) => Promise<void>;
}

declare global {
  interface Navigator {
    modelContext?: ModelContextApi;
  }
}

export {};