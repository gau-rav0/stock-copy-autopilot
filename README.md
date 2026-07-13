# FVI MCP Server

**Follow Verified Investors — Model Context Protocol Server**

This MCP server exposes the FVI investor platform data as tools for AI assistants like Claude Desktop. Connect it once, and Claude can answer questions like *"Who are the top 5 investors by CAGR?"*, *"Show me Arjun Mehta's portfolio"*, or *"Which investors hold INFY?"* — all using live tool calls.

It also guides both **creators** (verified investors who share their portfolio moves) and **users/followers** (people who follow and receive alerts) through their full connection flow.

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

## Creator Connects

A **creator** is a verified investor who shares their portfolio moves with followers.

### How it works

1. **Apply at `/connect`** — Upload your CAS (Consolidated Account Statement from NSDL/CDSL) or enter holdings manually.
2. **Review** — The FVI team reviews your submission. Once approved, your profile is marked verified (CAS tier, Broker tier, or Demo tier).
3. **Dashboard at `/creator/dashboard`** — Broadcast conviction alerts (BUY / SELL / ADD / TRIM), view past alerts, and see your follower count.
4. **Optional: Broker feed** — Register a Zerodha, Upstox, Angel One, or Groww connection. Status starts at `awaiting_authorization` until OAuth/API authorization is completed.
5. **MCP** — Connect this server to Claude Desktop so AI clients can answer questions about your portfolio.

> FVI never requests trading permissions and can never place orders on your behalf. Read-only display only.

**MCP tool**: Ask Claude `"How do I connect as a creator?"` — it will call `get_creator_connection_guide` and return the full step-by-step.

---

## User Connects

A **user/follower** discovers verified investors, follows their portfolios, and receives conviction alerts.

### How it works

1. **Explore at `/explore`** — Browse all verified investors. Each card shows CAGR, alpha, win rate, max drawdown, verification tier, and trust score.
2. **Follow** — Click Follow, enter your email. No account required — email is enough.
3. **Receive alerts** — Whenever a creator you follow broadcasts a move, you get an email immediately (creator name, action, ticker, rationale, and a one-click unsubscribe).
4. **Manage preferences** — Opt out of alert emails any time from the unsubscribe link or notification preferences page.
5. **MCP** — Connect this server to Claude Desktop to ask AI questions about investors.

> All alerts are read-only information, not investment advice or an instruction to trade.

**MCP tool**: Ask Claude `"How do I connect as a user?"` — it will call `get_user_connection_guide` and return the full step-by-step.

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

### 9. `get_creator_connection_guide`
Returns a full step-by-step guide for a **verified investor (creator)** to connect their portfolio to the FVI platform and to this MCP server. No parameters required.

**Example:** *"How do I connect as a creator?"* or *"How do I start broadcasting trade alerts?"*

---

### 10. `get_user_connection_guide`
Returns a full step-by-step guide for a **follower/user** to connect to the FVI platform, follow creators, receive conviction alerts, and use MCP to query investor data. No parameters required.

**Example:** *"How do I connect as a user?"* or *"How do I follow an investor?"*

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
