#!/usr/bin/env node
/**
 * FVI MCP Server ΓÇö Follow Verified Investors
 * Exposes investor profiles, holdings, track records, and analytics
 * as MCP tools for use with Claude Desktop and other MCP clients.
 *
 * NOTE: All data is fictional demo data for demonstration purposes only.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// DATA TYPES
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

interface InvestorProfile {
  id: string;
  displayName: string;
  bio: string;
  investingStyle: "value" | "growth" | "dividend" | "momentum" | "smallcap" | "longterm";
  isDemo: boolean;
  verified: boolean;
  verificationTier: "cas" | "broker" | "demo";
  followerCount: number;
  cagr: number;
  xirr: number;
  alpha: number;
  maxDrawdown: number;
  volatility: number;
  winRate: number;
}

interface Holding {
  ticker: string;
  companyName: string;
  allocationPct: number;
  avgBuyPrice: number;
  currentPrice: number;
  holdingSince: string;
  unrealizedReturnPct: number;
}

interface Transaction {
  date: string;
  ticker: string;
  companyName: string;
  action: "BUY" | "SELL" | "ADD" | "TRIM";
  price: number;
  notes: string;
  isConvictionAlert: boolean;
}

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// EMBEDDED INVESTOR DATA  (fictional demo data)
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const profiles: InvestorProfile[] = [
  {
    id: "arjun-mehta",
    displayName: "Arjun Mehta",
    bio: "Concentrated value investor. 12 years, 3 drawdowns, 0 diworsification.",
    investingStyle: "value",
    isDemo: true,
    verified: true,
    verificationTier: "cas",
    followerCount: 4210,
    cagr: 21.4,
    xirr: 23.1,
    alpha: 6.8,
    maxDrawdown: -31.2,
    volatility: 18.9,
    winRate: 64,
  },
  {
    id: "priya-shah",
    displayName: "Priya Shah",
    bio: "Small-cap hunter. If it is covered by 12 analysts, she probably sold it.",
    investingStyle: "smallcap",
    isDemo: true,
    verified: true,
    verificationTier: "broker",
    followerCount: 2870,
    cagr: 28.9,
    xirr: 31.4,
    alpha: 11.2,
    maxDrawdown: -42.6,
    volatility: 27.3,
    winRate: 57,
  },
  {
    id: "rahul-kapoor",
    displayName: "Rahul Kapoor",
    bio: "Growth at a reasonable price. Emphasis on reasonable.",
    investingStyle: "growth",
    isDemo: true,
    verified: true,
    verificationTier: "cas",
    followerCount: 6120,
    cagr: 19.7,
    xirr: 20.8,
    alpha: 4.1,
    maxDrawdown: -26.8,
    volatility: 16.4,
    winRate: 61,
  },
  {
    id: "neha-iyer",
    displayName: "Neha Iyer",
    bio: "Dividend compounder. Boring is a feature, not a bug.",
    investingStyle: "dividend",
    isDemo: true,
    verified: true,
    verificationTier: "demo",
    followerCount: 1540,
    cagr: 14.2,
    xirr: 14.9,
    alpha: 1.8,
    maxDrawdown: -14.3,
    volatility: 9.7,
    winRate: 70,
  },
  {
    id: "vikram-rao",
    displayName: "Vikram Rao",
    bio: "Momentum and trend-following. Cuts losers fast, lets winners get loud.",
    investingStyle: "momentum",
    isDemo: true,
    verified: false,
    verificationTier: "demo",
    followerCount: 890,
    cagr: 24.6,
    xirr: 22.0,
    alpha: 7.9,
    maxDrawdown: -38.1,
    volatility: 33.5,
    winRate: 49,
  },
  {
    id: "ananya-sen",
    displayName: "Ananya Sen",
    bio: "Long-term quality investor. Prefers moats, cash flows, and sleep.",
    investingStyle: "longterm",
    isDemo: true,
    verified: true,
    verificationTier: "cas",
    followerCount: 3380,
    cagr: 17.8,
    xirr: 18.6,
    alpha: 3.9,
    maxDrawdown: -19.4,
    volatility: 13.8,
    winRate: 66,
  },
  {
    id: "kabir-malhotra",
    displayName: "Kabir Malhotra",
    bio: "Contrarian value. Buys when everyone else is writing dramatic threads.",
    investingStyle: "value",
    isDemo: true,
    verified: true,
    verificationTier: "demo",
    followerCount: 2060,
    cagr: 16.9,
    xirr: 17.2,
    alpha: 2.6,
    maxDrawdown: -24.1,
    volatility: 15.6,
    winRate: 59,
  },
  {
    id: "mira-dsouza",
    displayName: "Mira D'Souza",
    bio: "Consumer and platform growth. Will pay up, but not blindly.",
    investingStyle: "growth",
    isDemo: true,
    verified: true,
    verificationTier: "broker",
    followerCount: 4725,
    cagr: 25.1,
    xirr: 26.3,
    alpha: 8.7,
    maxDrawdown: -29.7,
    volatility: 21.5,
    winRate: 62,
  },
  {
    id: "dev-narang",
    displayName: "Dev Narang",
    bio: "Dividend plus capital discipline. Slow money, clean notes.",
    investingStyle: "dividend",
    isDemo: true,
    verified: false,
    verificationTier: "demo",
    followerCount: 1185,
    cagr: 12.8,
    xirr: 13.5,
    alpha: 0.9,
    maxDrawdown: -12.2,
    volatility: 8.8,
    winRate: 72,
  },
  {
    id: "tara-gupta",
    displayName: "Tara Gupta",
    bio: "Mid and small-cap momentum with strict position sizing.",
    investingStyle: "smallcap",
    isDemo: true,
    verified: true,
    verificationTier: "cas",
    followerCount: 2540,
    cagr: 23.4,
    xirr: 24.2,
    alpha: 6.1,
    maxDrawdown: -34.8,
    volatility: 25.2,
    winRate: 55,
  },
];

// ΓöÇΓöÇ Holdings ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const holdingsByProfile: Record<string, Holding[]> = {
  "arjun-mehta": [
    { ticker: "HDFCBANK", companyName: "HDFC Bank", allocationPct: 22.4, avgBuyPrice: 1180, currentPrice: 1642, holdingSince: "2021-03-11", unrealizedReturnPct: 39.2 },
    { ticker: "INFY", companyName: "Infosys", allocationPct: 18.1, avgBuyPrice: 1340, currentPrice: 1512, holdingSince: "2020-11-02", unrealizedReturnPct: 12.8 },
    { ticker: "ITC", companyName: "ITC Ltd", allocationPct: 14.7, avgBuyPrice: 210, currentPrice: 438, holdingSince: "2019-06-18", unrealizedReturnPct: 108.6 },
    { ticker: "COALINDIA", companyName: "Coal India", allocationPct: 9.3, avgBuyPrice: 165, currentPrice: 421, holdingSince: "2022-01-24", unrealizedReturnPct: 155.2 },
    { ticker: "TATASTEEL", companyName: "Tata Steel", allocationPct: 8.0, avgBuyPrice: 98, currentPrice: 142, holdingSince: "2022-08-05", unrealizedReturnPct: 44.9 },
  ],
  "priya-shah": [
    { ticker: "KAYNES", companyName: "Kaynes Technology", allocationPct: 16.8, avgBuyPrice: 1750, currentPrice: 4710, holdingSince: "2023-08-04", unrealizedReturnPct: 169.1 },
    { ticker: "KPITTECH", companyName: "KPIT Technologies", allocationPct: 14.1, avgBuyPrice: 680, currentPrice: 1455, holdingSince: "2022-09-13", unrealizedReturnPct: 114.0 },
    { ticker: "CDSL", companyName: "CDSL", allocationPct: 12.4, avgBuyPrice: 970, currentPrice: 2280, holdingSince: "2021-12-10", unrealizedReturnPct: 135.1 },
    { ticker: "TANLA", companyName: "Tanla Platforms", allocationPct: 7.8, avgBuyPrice: 820, currentPrice: 930, holdingSince: "2024-04-22", unrealizedReturnPct: 13.4 },
  ],
  "rahul-kapoor": [
    { ticker: "INFY", companyName: "Infosys", allocationPct: 14.0, avgBuyPrice: 1290, currentPrice: 1512, holdingSince: "2023-02-14", unrealizedReturnPct: 17.2 },
    { ticker: "TCS", companyName: "Tata Consultancy Services", allocationPct: 13.2, avgBuyPrice: 3120, currentPrice: 3845, holdingSince: "2022-05-03", unrealizedReturnPct: 23.2 },
    { ticker: "BAJFINANCE", companyName: "Bajaj Finance", allocationPct: 12.5, avgBuyPrice: 5900, currentPrice: 7120, holdingSince: "2021-09-20", unrealizedReturnPct: 20.7 },
    { ticker: "TITAN", companyName: "Titan Company", allocationPct: 9.8, avgBuyPrice: 2200, currentPrice: 3380, holdingSince: "2020-12-01", unrealizedReturnPct: 53.6 },
  ],
  "neha-iyer": [
    { ticker: "HINDUNILVR", companyName: "Hindustan Unilever", allocationPct: 18.5, avgBuyPrice: 2210, currentPrice: 2530, holdingSince: "2020-02-17", unrealizedReturnPct: 14.5 },
    { ticker: "NESTLEIND", companyName: "Nestle India", allocationPct: 16.2, avgBuyPrice: 1880, currentPrice: 2490, holdingSince: "2019-10-01", unrealizedReturnPct: 32.4 },
    { ticker: "ITC", companyName: "ITC Ltd", allocationPct: 14.9, avgBuyPrice: 245, currentPrice: 438, holdingSince: "2021-04-20", unrealizedReturnPct: 78.8 },
    { ticker: "POWERGRID", companyName: "Power Grid", allocationPct: 11.1, avgBuyPrice: 178, currentPrice: 321, holdingSince: "2022-07-11", unrealizedReturnPct: 80.3 },
  ],
  "vikram-rao": [
    { ticker: "ADANIENT", companyName: "Adani Enterprises", allocationPct: 18.2, avgBuyPrice: 2100, currentPrice: 2875, holdingSince: "2024-01-10", unrealizedReturnPct: 36.9 },
    { ticker: "IRFC", companyName: "Indian Railway Finance Corp", allocationPct: 15.5, avgBuyPrice: 145, currentPrice: 218, holdingSince: "2023-11-20", unrealizedReturnPct: 50.3 },
    { ticker: "BHEL", companyName: "Bharat Heavy Electricals", allocationPct: 12.0, avgBuyPrice: 98, currentPrice: 242, holdingSince: "2024-02-05", unrealizedReturnPct: 146.9 },
  ],
  "ananya-sen": [
    { ticker: "ASIANPAINT", companyName: "Asian Paints", allocationPct: 16.5, avgBuyPrice: 2800, currentPrice: 3120, holdingSince: "2019-05-12", unrealizedReturnPct: 11.4 },
    { ticker: "PIDILITIND", companyName: "Pidilite Industries", allocationPct: 14.2, avgBuyPrice: 2100, currentPrice: 2950, holdingSince: "2020-08-30", unrealizedReturnPct: 40.5 },
    { ticker: "HDFC", companyName: "HDFC Ltd", allocationPct: 12.8, avgBuyPrice: 2450, currentPrice: 2850, holdingSince: "2021-01-15", unrealizedReturnPct: 16.3 },
    { ticker: "BAJAJFINSV", companyName: "Bajaj Finserv", allocationPct: 10.1, avgBuyPrice: 1540, currentPrice: 1980, holdingSince: "2020-06-22", unrealizedReturnPct: 28.6 },
  ],
  "kabir-malhotra": [
    { ticker: "ONGC", companyName: "Oil & Natural Gas Corp", allocationPct: 19.3, avgBuyPrice: 128, currentPrice: 268, holdingSince: "2022-03-14", unrealizedReturnPct: 109.4 },
    { ticker: "COALINDIA", companyName: "Coal India", allocationPct: 16.8, avgBuyPrice: 172, currentPrice: 421, holdingSince: "2022-06-18", unrealizedReturnPct: 144.8 },
    { ticker: "HDFCBANK", companyName: "HDFC Bank", allocationPct: 13.4, avgBuyPrice: 1490, currentPrice: 1642, holdingSince: "2023-09-01", unrealizedReturnPct: 10.2 },
    { ticker: "TATAMOTORS", companyName: "Tata Motors", allocationPct: 11.2, avgBuyPrice: 380, currentPrice: 945, holdingSince: "2021-10-28", unrealizedReturnPct: 148.7 },
  ],
  "mira-dsouza": [
    { ticker: "ZOMATO", companyName: "Zomato", allocationPct: 15.7, avgBuyPrice: 92, currentPrice: 218, holdingSince: "2023-05-08", unrealizedReturnPct: 137.0 },
    { ticker: "NYKAA", companyName: "FSN E-Commerce", allocationPct: 10.8, avgBuyPrice: 146, currentPrice: 184, holdingSince: "2024-02-14", unrealizedReturnPct: 26.0 },
    { ticker: "TITAN", companyName: "Titan Company", allocationPct: 10.2, avgBuyPrice: 2380, currentPrice: 3380, holdingSince: "2021-11-18", unrealizedReturnPct: 42.0 },
    { ticker: "POLYCAB", companyName: "Polycab India", allocationPct: 9.4, avgBuyPrice: 3520, currentPrice: 6420, holdingSince: "2023-03-28", unrealizedReturnPct: 82.4 },
  ],
  "dev-narang": [
    { ticker: "COALINDIA", companyName: "Coal India", allocationPct: 20.1, avgBuyPrice: 180, currentPrice: 421, holdingSince: "2022-04-10", unrealizedReturnPct: 133.9 },
    { ticker: "NTPC", companyName: "NTPC Ltd", allocationPct: 17.8, avgBuyPrice: 135, currentPrice: 360, holdingSince: "2021-08-23", unrealizedReturnPct: 166.7 },
    { ticker: "HINDUNILVR", companyName: "Hindustan Unilever", allocationPct: 13.5, avgBuyPrice: 2380, currentPrice: 2530, holdingSince: "2022-11-30", unrealizedReturnPct: 6.3 },
  ],
  "tara-gupta": [
    { ticker: "BSE", companyName: "BSE", allocationPct: 13.8, avgBuyPrice: 1040, currentPrice: 2960, holdingSince: "2023-10-10", unrealizedReturnPct: 184.6 },
    { ticker: "MAZDOCK", companyName: "Mazagon Dock", allocationPct: 11.7, avgBuyPrice: 1420, currentPrice: 4380, holdingSince: "2024-03-15", unrealizedReturnPct: 208.5 },
    { ticker: "COCHINSHIP", companyName: "Cochin Shipyard", allocationPct: 8.9, avgBuyPrice: 620, currentPrice: 1680, holdingSince: "2024-06-03", unrealizedReturnPct: 171.0 },
    { ticker: "KFINTECH", companyName: "KFin Technologies", allocationPct: 7.6, avgBuyPrice: 590, currentPrice: 1215, holdingSince: "2024-08-27", unrealizedReturnPct: 105.9 },
  ],
};

// ΓöÇΓöÇ Transactions ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const transactionsByProfile: Record<string, Transaction[]> = {
  "arjun-mehta": [
    { date: "2024-11-14", ticker: "COALINDIA", companyName: "Coal India", action: "ADD", price: 390, notes: "Added on dip. Dividend yield still compelling.", isConvictionAlert: false },
    { date: "2024-09-03", ticker: "HDFCBANK", companyName: "HDFC Bank", action: "ADD", price: 1580, notes: "Conviction add. Merger integration fears overblown.", isConvictionAlert: true },
    { date: "2024-06-20", ticker: "ITC", companyName: "ITC Ltd", action: "TRIM", price: 470, notes: "Trimmed 20% of position after 120%+ run. Rebalancing.", isConvictionAlert: false },
    { date: "2024-02-28", ticker: "TATASTEEL", companyName: "Tata Steel", action: "BUY", price: 108, notes: "New position. Steel cycle bottom incoming.", isConvictionAlert: true },
    { date: "2023-08-10", ticker: "INFY", companyName: "Infosys", action: "ADD", price: 1280, notes: "Added on guidance cut overreaction.", isConvictionAlert: false },
  ],
  "priya-shah": [
    { date: "2024-12-02", ticker: "KFINTECH", companyName: "KFin Technologies", action: "BUY", price: 612, notes: "Initiating. Capital markets proxy with clean mgmt.", isConvictionAlert: true },
    { date: "2024-10-15", ticker: "KAYNES", companyName: "Kaynes Technology", action: "TRIM", price: 5200, notes: "Trimmed 25% post 3x. Still holding core.", isConvictionAlert: false },
    { date: "2024-07-22", ticker: "TANLA", companyName: "Tanla Platforms", action: "BUY", price: 820, notes: "Beaten down, strong cash generation.", isConvictionAlert: true },
    { date: "2024-04-05", ticker: "CDSL", companyName: "CDSL", action: "ADD", price: 1850, notes: "Demat growth structural. Adding more.", isConvictionAlert: false },
  ],
  "rahul-kapoor": [
    { date: "2024-11-28", ticker: "BAJFINANCE", companyName: "Bajaj Finance", action: "ADD", price: 6800, notes: "Credit cost worries priced in. GARP opportunity.", isConvictionAlert: true },
    { date: "2024-08-18", ticker: "TCS", companyName: "Tata Consultancy Services", action: "TRIM", price: 4100, notes: "Trimmed at elevated valuations. Still holding 60%.", isConvictionAlert: false },
    { date: "2024-05-07", ticker: "TITAN", companyName: "Titan Company", action: "ADD", price: 3100, notes: "Jewellery segment stronger than expected.", isConvictionAlert: false },
    { date: "2024-01-30", ticker: "INFY", companyName: "Infosys", action: "ADD", price: 1310, notes: "Added on weakness. GARP play at these levels.", isConvictionAlert: true },
  ],
  "neha-iyer": [
    { date: "2024-10-22", ticker: "POWERGRID", companyName: "Power Grid", action: "ADD", price: 295, notes: "Dividend yield above 4%. Adding systematically.", isConvictionAlert: false },
    { date: "2024-07-08", ticker: "HINDUNILVR", companyName: "Hindustan Unilever", action: "TRIM", price: 2710, notes: "Valuation rich. Reducing allocation.", isConvictionAlert: false },
    { date: "2024-03-15", ticker: "NESTLEIND", companyName: "Nestle India", action: "ADD", price: 2100, notes: "Post correction add. Core holding.", isConvictionAlert: true },
  ],
  "vikram-rao": [
    { date: "2024-12-05", ticker: "BHEL", companyName: "Bharat Heavy Electricals", action: "TRIM", price: 290, notes: "Momentum signal weakening. Trimming 30%.", isConvictionAlert: false },
    { date: "2024-11-01", ticker: "IRFC", companyName: "IRFC", action: "ADD", price: 198, notes: "Rail infra theme strong. Breakout confirmed.", isConvictionAlert: true },
    { date: "2024-09-14", ticker: "ADANIENT", companyName: "Adani Enterprises", action: "BUY", price: 2420, notes: "Technical breakout with volume. Entering.", isConvictionAlert: false },
  ],
  "ananya-sen": [
    { date: "2024-12-10", ticker: "PIDILITIND", companyName: "Pidilite Industries", action: "ADD", price: 2780, notes: "Long-term compounder. Adding on any dip.", isConvictionAlert: true },
    { date: "2024-09-25", ticker: "ASIANPAINT", companyName: "Asian Paints", action: "TRIM", price: 3340, notes: "Valuation stretch. Trimming slightly.", isConvictionAlert: false },
    { date: "2024-06-12", ticker: "BAJAJFINSV", companyName: "Bajaj Finserv", action: "ADD", price: 1620, notes: "Insurance + lending franchise. Solid.", isConvictionAlert: false },
  ],
  "kabir-malhotra": [
    { date: "2024-11-20", ticker: "ONGC", companyName: "ONGC", action: "ADD", price: 240, notes: "Oil undervalued. Buying when consensus is bearish.", isConvictionAlert: true },
    { date: "2024-08-30", ticker: "TATAMOTORS", companyName: "Tata Motors", action: "TRIM", price: 1020, notes: "Trimmed after strong run. Still bullish long term.", isConvictionAlert: false },
    { date: "2024-04-18", ticker: "HDFCBANK", companyName: "HDFC Bank", action: "BUY", price: 1490, notes: "Consensus too negative on merger integration.", isConvictionAlert: true },
  ],
  "mira-dsouza": [
    { date: "2024-12-01", ticker: "NYKAA", companyName: "Nykaa", action: "ADD", price: 170, notes: "Beauty market secular story. Avg down.", isConvictionAlert: false },
    { date: "2024-10-08", ticker: "ZOMATO", companyName: "Zomato", action: "TRIM", price: 245, notes: "Trimmed 30% after 2.5x. Keeping core.", isConvictionAlert: false },
    { date: "2024-07-14", ticker: "POLYCAB", companyName: "Polycab India", action: "ADD", price: 5800, notes: "Electrification wave. Adding conviction.", isConvictionAlert: true },
  ],
  "dev-narang": [
    { date: "2024-11-05", ticker: "NTPC", companyName: "NTPC", action: "ADD", price: 330, notes: "Dividend consistency. Long-term hold.", isConvictionAlert: false },
    { date: "2024-07-22", ticker: "COALINDIA", companyName: "Coal India", action: "TRIM", price: 468, notes: "Trimmed 15% after significant gains.", isConvictionAlert: false },
    { date: "2024-02-10", ticker: "HINDUNILVR", companyName: "HUL", action: "BUY", price: 2380, notes: "Dividend track record impeccable.", isConvictionAlert: true },
  ],
  "tara-gupta": [
    { date: "2024-12-08", ticker: "KFINTECH", companyName: "KFin Technologies", action: "ADD", price: 1050, notes: "Position sizing up after strong Q2 results.", isConvictionAlert: true },
    { date: "2024-10-20", ticker: "MAZDOCK", companyName: "Mazagon Dock", action: "ADD", price: 3800, notes: "Defence order book strong. Holding firm.", isConvictionAlert: true },
    { date: "2024-08-12", ticker: "BSE", companyName: "BSE", action: "TRIM", price: 3200, notes: "Trimmed 20% on valuation comfort.", isConvictionAlert: false },
    { date: "2024-06-03", ticker: "COCHINSHIP", companyName: "Cochin Shipyard", action: "BUY", price: 620, notes: "New position. Shipbuilding upcycle.", isConvictionAlert: true },
  ],
};

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// HELPER UTILITIES
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function findInvestor(id: string): InvestorProfile | undefined {
  return profiles.find((p) => p.id === id);
}

function investorNotFoundError(id: string): string {
  const ids = profiles.map((p) => p.id).join(", ");
  return `Investor with id "${id}" not found. Available investor IDs are: ${ids}`;
}

/**
 * Compute a trust score (0ΓÇô100) for an investor.
 * Breakdown factors:
 *  - Verification tier  (0ΓÇô30 pts)
 *  - CAGR performance   (0ΓÇô25 pts)
 *  - Win rate           (0ΓÇô20 pts)
 *  - Low drawdown       (0ΓÇô15 pts)
 *  - Follower count     (0ΓÇô10 pts)
 */
function computeTrustScore(p: InvestorProfile): {
  score: number;
  breakdown: Record<string, number>;
  interpretation: string;
} {
  // Verification tier: cas=30, broker=20, demo=10
  const tierScore = p.verificationTier === "cas" ? 30 : p.verificationTier === "broker" ? 20 : 10;

  // CAGR: capped at 30% ΓåÆ maps 0ΓÇô30 to 0ΓÇô25
  const cagrScore = Math.min((p.cagr / 30) * 25, 25);

  // Win rate: 40%ΓÇô80% range ΓåÆ 0ΓÇô20 pts
  const winScore = Math.min(Math.max(((p.winRate - 40) / 40) * 20, 0), 20);

  // Max drawdown: 0% ΓåÆ 15 pts, -50% ΓåÆ 0 pts  (lower drawdown = higher score)
  const drawdownScore = Math.min(Math.max(((50 + p.maxDrawdown) / 50) * 15, 0), 15);

  // Follower count: 5000+ ΓåÆ 10 pts
  const followerScore = Math.min((p.followerCount / 5000) * 10, 10);

  const total = Math.round(tierScore + cagrScore + winScore + drawdownScore + followerScore);

  const interpretation =
    total >= 80
      ? "Excellent ΓÇö highly trustworthy track record"
      : total >= 65
      ? "Good ΓÇö strong overall profile"
      : total >= 50
      ? "Moderate ΓÇö solid but review carefully"
      : "Low ΓÇö limited verification or weak metrics";

  return {
    score: total,
    breakdown: {
      verificationTier: Math.round(tierScore),
      cagrPerformance: Math.round(cagrScore),
      winRate: Math.round(winScore),
      lowDrawdown: Math.round(drawdownScore),
      followerCount: Math.round(followerScore),
    },
    interpretation,
  };
}

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// TOOL DEFINITIONS
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const TOOLS: Tool[] = [
  {
    name: "list_investors",
    description:
      "Returns all FVI investors with key metrics. Optionally filter by investing style and/or verification tier.",
    inputSchema: {
      type: "object",
      properties: {
        style: {
          type: "string",
          enum: ["value", "growth", "dividend", "momentum", "smallcap", "longterm"],
          description: "Filter by investing style.",
        },
        verificationTier: {
          type: "string",
          enum: ["cas", "broker", "demo"],
          description: "Filter by verification tier. 'cas' = SEBI-registered CAS verified, 'broker' = broker-verified, 'demo' = demo/unverified.",
        },
      },
    },
  },
  {
    name: "get_investor_profile",
    description:
      "Gets the full detailed profile for a specific investor by their ID, including bio, all performance metrics, trust score, top holdings, and recent transactions.",
    inputSchema: {
      type: "object",
      properties: {
        investorId: {
          type: "string",
          description: "The investor's unique ID (e.g. 'arjun-mehta', 'priya-shah').",
        },
      },
      required: ["investorId"],
    },
  },
  {
    name: "get_investor_holdings",
    description:
      "Returns the full holdings list for an investor by ID. Each holding shows ticker, company name, allocation %, average buy price, current price, holding since date, and unrealized return %.",
    inputSchema: {
      type: "object",
      properties: {
        investorId: {
          type: "string",
          description: "The investor's unique ID.",
        },
      },
      required: ["investorId"],
    },
  },
  {
    name: "get_investor_transactions",
    description:
      "Returns the transaction history for an investor by ID. Optionally filter to only show high-conviction alerts.",
    inputSchema: {
      type: "object",
      properties: {
        investorId: {
          type: "string",
          description: "The investor's unique ID.",
        },
        convictionOnly: {
          type: "boolean",
          description: "If true, only return transactions marked as conviction alerts.",
        },
      },
      required: ["investorId"],
    },
  },
  {
    name: "compare_investors",
    description:
      "Compares two investors side by side across all key metrics ΓÇö CAGR, alpha, win rate, max drawdown, volatility, followers, verification tier, and trust score.",
    inputSchema: {
      type: "object",
      properties: {
        investorIdA: {
          type: "string",
          description: "ID of the first investor.",
        },
        investorIdB: {
          type: "string",
          description: "ID of the second investor.",
        },
      },
      required: ["investorIdA", "investorIdB"],
    },
  },
  {
    name: "get_top_investors",
    description:
      "Returns the top N investors sorted by a chosen metric: CAGR, alpha, winRate, or followerCount.",
    inputSchema: {
      type: "object",
      properties: {
        sortBy: {
          type: "string",
          enum: ["cagr", "alpha", "winRate", "followerCount"],
          description: "Metric to sort by. Defaults to 'cagr'.",
        },
        n: {
          type: "number",
          description: "Number of top investors to return. Defaults to 5.",
        },
      },
    },
  },
  {
    name: "search_investors_by_holding",
    description:
      "Finds all investors who currently hold a specific NSE ticker symbol in their portfolio.",
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: "NSE ticker symbol to search for (e.g. 'INFY', 'ITC', 'TITAN').",
        },
      },
      required: ["ticker"],
    },
  },
  {
    name: "get_trust_score",
    description:
      "Calculates and returns the trust score (0ΓÇô100) for an investor along with a full breakdown of the contributing factors: verification tier, CAGR performance, win rate, drawdown, and follower count.",
    inputSchema: {
      type: "object",
      properties: {
        investorId: {
          type: "string",
          description: "The investor's unique ID.",
        },
      },
      required: ["investorId"],
    },
  },
  {
    name: "get_creator_connection_guide",
    description:
      "Returns a step-by-step guide for a verified investor (creator) to connect their portfolio to the Follow Verified Investors platform and expose it through the MCP server. Use this when a user asks how to become a creator, how to link their portfolio, or how to broadcast trade alerts.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_user_connection_guide",
    description:
      "Returns a step-by-step guide for a follower (regular user) to connect to the Follow Verified Investors platform, follow verified creators, and use the MCP server to query their feed. Use this when a user asks how to follow investors, receive alerts, or use MCP as a follower.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// TOOL HANDLERS
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function handleListInvestors(args: Record<string, unknown>): string {
  let filtered = [...profiles];

  if (args.style) {
    filtered = filtered.filter((p) => p.investingStyle === args.style);
  }
  if (args.verificationTier) {
    filtered = filtered.filter((p) => p.verificationTier === args.verificationTier);
  }

  const result = filtered.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    investingStyle: p.investingStyle,
    verificationTier: p.verificationTier,
    verified: p.verified,
    cagr: p.cagr,
    maxDrawdown: p.maxDrawdown,
    followerCount: p.followerCount,
    winRate: p.winRate,
  }));

  if (result.length === 0) {
    return JSON.stringify({ message: "No investors match the given filters.", investors: [] });
  }

  return JSON.stringify({ count: result.length, investors: result }, null, 2);
}

function handleGetInvestorProfile(args: Record<string, unknown>): string {
  const id = args.investorId as string;
  const p = findInvestor(id);
  if (!p) return JSON.stringify({ error: investorNotFoundError(id) });

  const trust = computeTrustScore(p);
  const holdings = holdingsByProfile[id] ?? [];
  const transactions = transactionsByProfile[id] ?? [];

  const topHoldings = [...holdings]
    .sort((a, b) => b.allocationPct - a.allocationPct)
    .slice(0, 5);

  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return JSON.stringify(
    {
      id: p.id,
      displayName: p.displayName,
      bio: p.bio,
      investingStyle: p.investingStyle,
      verified: p.verified,
      verificationTier: p.verificationTier,
      followerCount: p.followerCount,
      isDemo: p.isDemo,
      performance: {
        cagr: p.cagr,
        xirr: p.xirr,
        alpha: p.alpha,
        maxDrawdown: p.maxDrawdown,
        volatility: p.volatility,
        winRate: p.winRate,
      },
      trustScore: trust,
      topHoldings,
      recentTransactions,
    },
    null,
    2
  );
}

function handleGetInvestorHoldings(args: Record<string, unknown>): string {
  const id = args.investorId as string;
  const p = findInvestor(id);
  if (!p) return JSON.stringify({ error: investorNotFoundError(id) });

  const holdings = holdingsByProfile[id] ?? [];
  if (holdings.length === 0) {
    return JSON.stringify({ investorId: id, message: "No holdings data available.", holdings: [] });
  }

  const sorted = [...holdings].sort((a, b) => b.allocationPct - a.allocationPct);
  const totalAllocated = sorted.reduce((sum, h) => sum + h.allocationPct, 0);

  return JSON.stringify(
    {
      investorId: id,
      displayName: p.displayName,
      totalPositions: sorted.length,
      totalAllocatedPct: Math.round(totalAllocated * 10) / 10,
      holdings: sorted,
    },
    null,
    2
  );
}

function handleGetInvestorTransactions(args: Record<string, unknown>): string {
  const id = args.investorId as string;
  const p = findInvestor(id);
  if (!p) return JSON.stringify({ error: investorNotFoundError(id) });

  let txns = transactionsByProfile[id] ?? [];

  if (args.convictionOnly === true) {
    txns = txns.filter((t) => t.isConvictionAlert);
  }

  const sorted = [...txns].sort((a, b) => b.date.localeCompare(a.date));

  return JSON.stringify(
    {
      investorId: id,
      displayName: p.displayName,
      convictionOnly: args.convictionOnly === true,
      count: sorted.length,
      transactions: sorted,
    },
    null,
    2
  );
}

function handleCompareInvestors(args: Record<string, unknown>): string {
  const idA = args.investorIdA as string;
  const idB = args.investorIdB as string;

  const a = findInvestor(idA);
  const b = findInvestor(idB);

  if (!a) return JSON.stringify({ error: investorNotFoundError(idA) });
  if (!b) return JSON.stringify({ error: investorNotFoundError(idB) });

  const trustA = computeTrustScore(a);
  const trustB = computeTrustScore(b);

  const metric = (label: string, valA: number, valB: number, higherBetter = true) => ({
    metric: label,
    [a.displayName]: valA,
    [b.displayName]: valB,
    winner:
      valA === valB
        ? "Tie"
        : higherBetter
        ? valA > valB
          ? a.displayName
          : b.displayName
        : valA < valB
        ? a.displayName
        : b.displayName,
  });

  const comparison = [
    metric("CAGR (%)", a.cagr, b.cagr),
    metric("XIRR (%)", a.xirr, b.xirr),
    metric("Alpha (%)", a.alpha, b.alpha),
    metric("Win Rate (%)", a.winRate, b.winRate),
    metric("Max Drawdown (%)", a.maxDrawdown, b.maxDrawdown, false /* lower = better */),
    metric("Volatility (%)", a.volatility, b.volatility, false),
    metric("Follower Count", a.followerCount, b.followerCount),
    metric("Trust Score", trustA.score, trustB.score),
  ];

  return JSON.stringify(
    {
      investorA: { id: a.id, displayName: a.displayName, style: a.investingStyle, tier: a.verificationTier },
      investorB: { id: b.id, displayName: b.displayName, style: b.investingStyle, tier: b.verificationTier },
      comparison,
    },
    null,
    2
  );
}

function handleGetTopInvestors(args: Record<string, unknown>): string {
  const sortBy = (args.sortBy as string) || "cagr";
  const n = Math.min(Math.max(Math.round((args.n as number) || 5), 1), profiles.length);

  const validSortKeys = ["cagr", "alpha", "winRate", "followerCount"] as const;
  type SortKey = (typeof validSortKeys)[number];

  if (!validSortKeys.includes(sortBy as SortKey)) {
    return JSON.stringify({ error: `Invalid sortBy value. Must be one of: ${validSortKeys.join(", ")}` });
  }

  const key = sortBy as SortKey;

  const sorted = [...profiles]
    .sort((a, b) => (b[key] as number) - (a[key] as number))
    .slice(0, n)
    .map((p, i) => ({
      rank: i + 1,
      id: p.id,
      displayName: p.displayName,
      investingStyle: p.investingStyle,
      verificationTier: p.verificationTier,
      [key]: p[key],
      cagr: p.cagr,
      alpha: p.alpha,
      winRate: p.winRate,
      followerCount: p.followerCount,
    }));

  return JSON.stringify({ sortedBy: sortBy, topN: n, investors: sorted }, null, 2);
}

function handleSearchInvestorsByHolding(args: Record<string, unknown>): string {
  const ticker = (args.ticker as string).toUpperCase().trim();

  const matches: Array<{
    investorId: string;
    displayName: string;
    investingStyle: string;
    holding: Holding;
  }> = [];

  for (const [investorId, holdings] of Object.entries(holdingsByProfile)) {
    const holding = holdings.find((h) => h.ticker.toUpperCase() === ticker);
    if (holding) {
      const p = findInvestor(investorId);
      if (p) {
        matches.push({
          investorId,
          displayName: p.displayName,
          investingStyle: p.investingStyle,
          holding,
        });
      }
    }
  }

  if (matches.length === 0) {
    return JSON.stringify({
      ticker,
      message: `No investors in the FVI database currently hold ${ticker}.`,
      investors: [],
    });
  }

  // Sort by allocation % descending
  matches.sort((a, b) => b.holding.allocationPct - a.holding.allocationPct);

  return JSON.stringify({ ticker, count: matches.length, investors: matches }, null, 2);
}

function handleGetTrustScore(args: Record<string, unknown>): string {
  const id = args.investorId as string;
  const p = findInvestor(id);
  if (!p) return JSON.stringify({ error: investorNotFoundError(id) });

  const { score, breakdown, interpretation } = computeTrustScore(p);

  return JSON.stringify(
    {
      investorId: id,
      displayName: p.displayName,
      verificationTier: p.verificationTier,
      trustScore: score,
      outOf: 100,
      interpretation,
      breakdown: {
        verificationTier: {
          points: breakdown.verificationTier,
          maxPoints: 30,
          note: `Tier: ${p.verificationTier} (cas=30, broker=20, demo=10)`,
        },
        cagrPerformance: {
          points: breakdown.cagrPerformance,
          maxPoints: 25,
          note: `CAGR: ${p.cagr}% (scaled to 30% cap)`,
        },
        winRate: {
          points: breakdown.winRate,
          maxPoints: 20,
          note: `Win rate: ${p.winRate}% (range 40%ΓÇô80%)`,
        },
        lowDrawdown: {
          points: breakdown.lowDrawdown,
          maxPoints: 15,
          note: `Max drawdown: ${p.maxDrawdown}% (lower is better)`,
        },
        followerCount: {
          points: breakdown.followerCount,
          maxPoints: 10,
          note: `Followers: ${p.followerCount} (5000+ = full 10 pts)`,
        },
      },
    },
    null,
    2
  );
}

function handleGetCreatorConnectionGuide(): string {
  return JSON.stringify(
    {
      title: "Creator Connection Guide — Follow Verified Investors",
      summary:
        "As a creator you share your real, verified portfolio moves with followers. Here is the complete connection flow.",
      steps: [
        {
          step: 1,
          title: "Apply to become a creator",
          url: "https://follow-verified-investors.vercel.app/connect",
          description:
            "Visit /connect and choose one of two verification methods:\n" +
            "  • Upload CAS statement — Your Consolidated Account Statement from NSDL, CDSL, or your broker. FVI parses equity rows for a reviewer check. Profile status: pending-cas-verification until approved.\n" +
            "  • Enter holdings manually — Faster to start, but profile shows as unverified until CAS or broker verification is later added.",
          note: "FVI never requests trading permissions and can never place orders on your behalf. This is strictly read-only.",
        },
        {
          step: 2,
          title: "Wait for review and verification",
          description:
            "The FVI admin team reviews your submitted evidence. Once approved your profile is marked 'verified' with the appropriate tier:\n" +
            "  • CAS tier — uploaded and reviewed CAS statement\n" +
            "  • Broker tier — broker read-only connection (when available)\n" +
            "  • Demo tier — demo/test profile",
          note: "Broker read-only sync is pending SEBI and broker ToS review and is not yet available in this build.",
        },
        {
          step: 3,
          title: "Access your creator dashboard",
          url: "https://follow-verified-investors.vercel.app/creator/dashboard",
          description:
            "Once verified, log in and go to /creator/dashboard. From here you can:\n" +
            "  • Broadcast a conviction alert — share a BUY / SELL / ADD / TRIM with a note\n" +
            "  • View past alerts you have broadcasted\n" +
            "  • See your follower count",
        },
        {
          step: 4,
          title: "(Optional) Connect a read-only broker feed",
          description:
            "On the dashboard you can register a broker connection (Zerodha, Upstox, Angel One, Groww, or Other). " +
            "This saves the intent and puts the connection in 'awaiting_authorization' status until the broker's OAuth or API authorization is completed. " +
            "When active, completed trades can automatically become conviction alerts sent to followers.",
          brokers: ["zerodha", "upstox", "angelone", "groww", "other"],
        },
        {
          step: 5,
          title: "Connect this MCP server to Claude Desktop (for AI queries)",
          description:
            "Add the following to your claude_desktop_config.json (usually at %APPDATA%\\Claude\\claude_desktop_config.json on Windows):",
          config: {
            mcpServers: {
              fvi: {
                command: "node",
                args: ["C:\\path\\to\\fvi-mcp-server\\dist\\index.js"],
              },
            },
          },
          note: "After adding the config, restart Claude Desktop. You and your followers can then ask Claude questions like 'Show me my portfolio', 'Who are the top investors?', or 'Compare Arjun Mehta and Priya Shah'.",
        },
      ],
      platformUrl: "https://follow-verified-investors.vercel.app",
      privacyModel:
        "Read-only display only. No trading permissions ever requested. No broker passwords or API keys stored. You choose exactly what to publish.",
    },
    null,
    2
  );
}

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function handleGetUserConnectionGuide(): string {
  return JSON.stringify(
    {
      title: "User / Follower Connection Guide — Follow Verified Investors",
      summary:
        "As a follower you discover verified investors, follow their portfolios, and receive real-time conviction alerts when they make moves. Here is the complete flow.",
      steps: [
        {
          step: 1,
          title: "Explore verified investors",
          url: "https://follow-verified-investors.vercel.app/explore",
          description:
            "Browse the full list of verified investors at /explore. Each card shows:\n" +
            "  • CAGR, alpha, win rate, max drawdown\n" +
            "  • Verification tier (CAS / Broker / Demo)\n" +
            "  • Investing style (value, growth, dividend, momentum, smallcap, longterm)\n" +
            "  • Follower count and trust score",
        },
        {
          step: 2,
          title: "Follow an investor",
          description:
            "Click 'Follow' on any investor card. You will be prompted to enter your email address. " +
            "No account creation is required — your email is all that is needed to receive trade alerts. " +
            "You can also manage notification preferences after following.",
          note: "Following is free. Alerts are delivered by email as soon as a creator broadcasts a conviction move.",
        },
        {
          step: 3,
          title: "Receive conviction alerts by email",
          description:
            "When a creator you follow broadcasts an alert (BUY / SELL / ADD / TRIM on a ticker), " +
            "you receive an email immediately with:\n" +
            "  • Creator name\n" +
            "  • Action and ticker\n" +
            "  • Creator's note/rationale\n" +
            "  • Unsubscribe link (one-click, List-Unsubscribe compatible)",
          note: "This is read-only information, not investment advice or an instruction to trade.",
        },
        {
          step: 4,
          title: "Manage notification preferences",
          description:
            "You can opt out of trade alert emails at any time via the unsubscribe link in any email, " +
            "or by visiting your notification preferences page.",
        },
        {
          step: 5,
          title: "Use this MCP server to query the platform with AI",
          description:
            "Connect the FVI MCP server to Claude Desktop to ask natural-language questions about investors:",
          exampleQueries: [
            "Who are the top 5 investors by CAGR?",
            "Show me all dividend investors",
            "What does Arjun Mehta hold in his portfolio?",
            "Which investors hold INFY?",
            "Compare Priya Shah and Rahul Kapoor",
            "What is Neha Iyer's trust score and why?",
            "Show Arjun Mehta's conviction buys",
          ],
          config: {
            mcpServers: {
              fvi: {
                command: "node",
                args: ["C:\\path\\to\\fvi-mcp-server\\dist\\index.js"],
              },
            },
          },
          configPath: "%APPDATA%\\Claude\\claude_desktop_config.json (Windows)",
          note: "Restart Claude Desktop after saving the config. The FVI tools will appear in the tool picker.",
        },
      ],
      platformUrl: "https://follow-verified-investors.vercel.app",
      disclaimer:
        "All alerts are read-only portfolio disclosures. FVI cannot place trades on your behalf. This is not investment advice.",
    },
    null,
    2
  );
}


// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const server = new Server(
  {
    name: "fvi-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const safeArgs = (args ?? {}) as Record<string, unknown>;

  let result: string;

  try {
    switch (name) {
      case "list_investors":
        result = handleListInvestors(safeArgs);
        break;
      case "get_investor_profile":
        result = handleGetInvestorProfile(safeArgs);
        break;
      case "get_investor_holdings":
        result = handleGetInvestorHoldings(safeArgs);
        break;
      case "get_investor_transactions":
        result = handleGetInvestorTransactions(safeArgs);
        break;
      case "compare_investors":
        result = handleCompareInvestors(safeArgs);
        break;
      case "get_top_investors":
        result = handleGetTopInvestors(safeArgs);
        break;
      case "search_investors_by_holding":
        result = handleSearchInvestorsByHolding(safeArgs);
        break;
      case "get_trust_score":
        result = handleGetTrustScore(safeArgs);
        break;
      case "get_creator_connection_guide":
        result = handleGetCreatorConnectionGuide();
        break;
      case "get_user_connection_guide":
        result = handleGetUserConnectionGuide();
        break;
      default:
        result = JSON.stringify({ error: `Unknown tool: "${name}". Check tool name and try again.` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result = JSON.stringify({ error: `Tool execution failed: ${message}` });
  }

  return {
    content: [{ type: "text", text: result }],
  };
});

// Start the server
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Server is running ΓÇö logs intentionally sent to stderr so stdout stays clean for MCP protocol
  process.stderr.write("FVI MCP Server running on stdio\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
