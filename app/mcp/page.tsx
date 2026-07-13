import type { Metadata } from "next";
import { Terminal, Code, MessageSquare, Bot } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Integration — Model Context Protocol (MCP)",
  description:
    "Connect Follow Verified Investors to Claude Desktop using the Model Context Protocol (MCP) to query portfolios naturally.",
  keywords: ["mcp", "claude desktop", "ai integration", "model context protocol", "FVI MCP"],
};

const EXAMPLES = [
  "Who are the top 5 investors by CAGR?",
  "Show me all dividend investors",
  "What does Arjun Mehta hold in his portfolio?",
  "Which investors hold INFY?",
  "Compare Priya Shah and Rahul Kapoor",
  "What is Neha Iyer's trust score and why?",
  "Show Arjun Mehta's conviction buys",
];

export default function McpPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">AI Integration</p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-paper sm:text-5xl">
        Connect FVI directly to your AI Assistant
      </h1>
      <p className="mt-4 max-w-2xl text-paper-muted">
        Use the Model Context Protocol (MCP) to plug Follow Verified Investors live data directly into Claude Desktop. Ask questions naturally and get real-time portfolio insights.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-6 backdrop-blur">
          <div className="flex items-center gap-3 mb-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-brass/10 text-brass">
              <Bot size={20} />
            </div>
            <h2 className="font-display text-2xl text-paper">For Followers</h2>
          </div>
          <p className="text-sm leading-6 text-paper-muted">
            Ask Claude to analyze investors for you. You can filter by style, compare performance side-by-side, or search for who holds a specific stock—all through natural conversation without clicking through profiles manually.
          </p>
        </div>

        <div className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-6 backdrop-blur">
          <div className="flex items-center gap-3 mb-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-brass/10 text-brass">
              <Code size={20} />
            </div>
            <h2 className="font-display text-2xl text-paper">For Creators</h2>
          </div>
          <p className="text-sm leading-6 text-paper-muted">
            Let your followers interact with your track record dynamically. By making your data available via MCP, followers can ask an AI to explain your trust score, summarize your recent conviction alerts, or compare your alpha against others.
          </p>
        </div>
      </div>

      <div className="mt-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brass/10 text-brass"><Terminal size={16} /></div>
          <h2 className="font-display text-2xl text-paper">Configuration Guide</h2>
        </div>
        
        <div className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-6 backdrop-blur">
          <h3 className="font-display text-lg text-paper">1. Install Claude Desktop</h3>
          <p className="mt-2 text-sm leading-6 text-paper-muted">
            Ensure you have the latest version of Claude Desktop installed on your machine. The MCP server runs locally to bridge Claude with FVI data.
          </p>

          <h3 className="mt-8 font-display text-lg text-paper">2. Update Configuration</h3>
          <p className="mt-2 text-sm leading-6 text-paper-muted">
            Open your Claude Desktop configuration file. On Windows, this is typically located at <code className="bg-black/30 px-1 py-0.5 rounded text-brass">{"%APPDATA%\\Claude\\claude_desktop_config.json"}</code>. On Mac, it's at <code className="bg-black/30 px-1 py-0.5 rounded text-brass">{"~/Library/Application Support/Claude/claude_desktop_config.json"}</code>.
          </p>
          <p className="mt-2 text-sm leading-6 text-paper-muted">
            Add the <code className="text-paper">fvi</code> server to your <code className="text-paper">mcpServers</code> configuration, pointing to your local <code className="text-paper">fvi-mcp-server</code> installation:
          </p>
          
          <div className="mt-4 overflow-x-auto rounded border border-ink-hairline bg-black/40 p-4">
            <pre className="text-sm text-paper-muted font-mono leading-relaxed">
{`{
  "mcpServers": {
    "fvi": {
      "command": "node",
      "args": [
        "C:\\\\path\\\\to\\\\follow-verified-investors\\\\fvi-mcp-server\\\\dist\\\\index.js"
      ]
    }
  }
}`}
            </pre>
          </div>

          <h3 className="mt-8 font-display text-lg text-paper">3. Restart Claude Desktop</h3>
          <p className="mt-2 text-sm leading-6 text-paper-muted">
            Save the file and completely restart Claude Desktop. When you open a new chat, you should see a small "plug" icon indicating that the FVI tools are connected and available.
          </p>
        </div>
      </div>

      <div className="mt-12 rounded-lg border border-ink-hairline bg-ink-elevated/75 p-6 backdrop-blur">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare size={18} className="text-brass" />
          <h2 className="font-display text-xl text-paper">Things you can ask Claude</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {EXAMPLES.map((example) => (
            <div key={example} className="flex items-start gap-2 text-sm text-paper-muted">
              <span className="mt-0.5 text-brass shrink-0">"</span>
              {example}"
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
