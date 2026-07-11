# FVI MCP Server

**Follow Verified Investors — Model Context Protocol Server**

This MCP server exposes the FVI investor platform data as tools for AI assistants like Claude Desktop. Connect it once, and Claude can answer questions like *"Who are the top 5 investors by CAGR?"*, *"Show me Arjun Mehta's portfolio"*, or *"Which investors hold INFY?"* — all using live tool calls.

> ⚠️ **All investor data in this server is fictional demo data** created for demonstration and development purposes only. It does not represent real investment advice or real portfolios.

---

## Installation

```bash
cd fvi-mcp-server
npm install
npm run build
```

This compiles TypeScript to `dist/index.js`. The server is ready to use.

---

## Claude Desktop Configuration

Add this to your `claude_desktop_config.json` (usually at `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "fvi": {
      "command": "node",
      "args": [
        "C:\\Users\\lenovo\\Downloads\\follow-verified-investors\\fvi-mcp-server\\dist\\index.js"
      ]
    }
  }
}
```

Restart Claude Desktop after saving. You should see the FVI tools available in the tool picker.

---

## Available Tools

### 1. `list_investors`
Returns all investors with key metrics. Supports optional filters.

| Parameter | Type | Description |
|-----------|------|-------------|
| `style` | string (optional) | Filter by style: `value`, `growth`, `dividend`, `momentum`, `smallcap`, `longterm` |
| `verificationTier` | string (optional) | Filter by tier: `cas`, `broker`, `demo` |

**Example:** *"Show me all dividend investors"*

---

### 2. `get_investor_profile`
Full detailed profile for one investor — bio, all metrics, trust score, top holdings, and recent transactions.

| Parameter | Type | Description |
|-----------|------|-------------|
| `investorId` | string (required) | Investor ID e.g. `arjun-mehta` |

**Example:** *"Get Priya Shah's full profile"*

---

### 3. `get_investor_holdings`
Complete holdings list for an investor sorted by allocation %.

| Parameter | Type | Description |
|-----------|------|-------------|
| `investorId` | string (required) | Investor ID |

**Example:** *"What does Rahul Kapoor hold in his portfolio?"*

---

### 4. `get_investor_transactions`
Transaction history for an investor. Optionally filter to conviction alerts only.

| Parameter | Type | Description |
|-----------|------|-------------|
| `investorId` | string (required) | Investor ID |
| `convictionOnly` | boolean (optional) | If `true`, only return high-conviction alerts |

**Example:** *"Show Arjun Mehta's conviction buys"*

---

### 5. `compare_investors`
Side-by-side comparison of two investors across all key metrics with a winner column.

| Parameter | Type | Description |
|-----------|------|-------------|
| `investorIdA` | string (required) | First investor ID |
| `investorIdB` | string (required) | Second investor ID |

**Example:** *"Compare Arjun Mehta and Priya Shah"*

---

### 6. `get_top_investors`
Returns the top N investors sorted by a chosen metric.

| Parameter | Type | Description |
|-----------|------|-------------|
| `sortBy` | string (optional) | `cagr` (default), `alpha`, `winRate`, or `followerCount` |
| `n` | number (optional) | How many to return (default: 5) |

**Example:** *"Who are the top 3 investors by alpha?"*

---

### 7. `search_investors_by_holding`
Finds all investors who hold a specific NSE ticker.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ticker` | string (required) | NSE ticker symbol e.g. `INFY`, `ITC`, `TITAN` |

**Example:** *"Which investors hold ITC?"*

---

### 8. `get_trust_score`
Calculates and explains the trust score (0–100) for an investor with a full factor breakdown.

| Parameter | Type | Description |
|-----------|------|-------------|
| `investorId` | string (required) | Investor ID |

**Trust score factors:**
- Verification tier (0–30 pts): CAS=30, Broker=20, Demo=10
- CAGR performance (0–25 pts)
- Win rate (0–20 pts)
- Low max drawdown (0–15 pts)
- Follower count (0–10 pts)

**Example:** *"What is Neha Iyer's trust score and why?"*

---

## Available Investor IDs

| ID | Name | Style | Tier |
|----|------|-------|------|
| `arjun-mehta` | Arjun Mehta | value | cas |
| `priya-shah` | Priya Shah | smallcap | broker |
| `rahul-kapoor` | Rahul Kapoor | growth | cas |
| `neha-iyer` | Neha Iyer | dividend | demo |
| `vikram-rao` | Vikram Rao | momentum | demo |
| `ananya-sen` | Ananya Sen | longterm | cas |
| `kabir-malhotra` | Kabir Malhotra | value | demo |
| `mira-dsouza` | Mira D'Souza | growth | broker |
| `dev-narang` | Dev Narang | dividend | demo |
| `tara-gupta` | Tara Gupta | smallcap | cas |

---

## Using with Other MCP Clients

This server uses the standard **stdio transport**, which is compatible with any MCP client that supports stdio-based servers.

**Generic configuration pattern:**
```json
{
  "command": "node",
  "args": ["/absolute/path/to/fvi-mcp-server/dist/index.js"]
}
```

**Running manually for testing:**
```bash
node dist/index.js
```
Then send MCP JSON-RPC messages over stdin/stdout.

---

## Development

```bash
# Watch mode — recompiles on file changes
npm run dev

# Build once
npm run build

# Run the compiled server
npm start
```

---

## Project Structure

```
fvi-mcp-server/
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── README.md             # This file
└── src/
    └── index.ts          # MCP server — all tools, data, and handlers
```

---

## License

MIT
