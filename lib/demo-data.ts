import { GrowthPoint, Holding, Profile, Transaction } from "./types";

// Fictional demo data only. Do not present these as real investors or real portfolios.

export const profiles: Profile[] = [
  {
    id: "arjun-mehta",
    displayName: "Arjun Mehta",
    bio: "Concentrated value investor. 12 years, 3 drawdowns, 0 diworsification.",
    photoUrl: "",
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
    subscriptionFeeInr: 999,
  },
  {
    id: "priya-shah",
    displayName: "Priya Shah",
    bio: "Small-cap hunter. If it is covered by 12 analysts, she probably sold it.",
    photoUrl: "",
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
    subscriptionFeeInr: 0,
  },
  {
    id: "rahul-kapoor",
    displayName: "Rahul Kapoor",
    bio: "Growth at a reasonable price. Emphasis on reasonable.",
    photoUrl: "",
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
    subscriptionFeeInr: 499,
  },
  {
    id: "neha-iyer",
    displayName: "Neha Iyer",
    bio: "Dividend compounder. Boring is a feature, not a bug.",
    photoUrl: "",
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
    subscriptionFeeInr: 0,
  },
  {
    id: "vikram-rao",
    displayName: "Vikram Rao",
    bio: "Momentum and trend-following. Cuts losers fast, lets winners get loud.",
    photoUrl: "",
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
    winRate: 70,
    subscriptionFeeInr: 0,
  },
  {
    id: "ananya-sen",
    displayName: "Ananya Sen",
    bio: "Long-term quality investor. Prefers moats, cash flows, and sleep.",
    photoUrl: "",
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
    winRate: 70,
    subscriptionFeeInr: 0,
  },
  {
    id: "kabir-malhotra",
    displayName: "Kabir Malhotra",
    bio: "Contrarian value. Buys when everyone else is writing dramatic threads.",
    photoUrl: "",
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
    winRate: 70,
    subscriptionFeeInr: 0,
  },
  {
    id: "mira-dsouza",
    displayName: "Mira D'Souza",
    bio: "Consumer and platform growth. Will pay up, but not blindly.",
    photoUrl: "",
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
    winRate: 70,
    subscriptionFeeInr: 0,
  },
  {
    id: "dev-narang",
    displayName: "Dev Narang",
    bio: "Dividend plus capital discipline. Slow money, clean notes.",
    photoUrl: "",
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
    subscriptionFeeInr: 499,
  },
  {
    id: "tara-gupta",
    displayName: "Tara Gupta",
    bio: "Mid and small-cap momentum with strict position sizing.",
    photoUrl: "",
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
    winRate: 70,
    subscriptionFeeInr: 0,
  },
];

export const holdingsByProfile: Record<string, Holding[]> = {
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
    { ticker: "TRENT", companyName: "Trent", allocationPct: 15.2, avgBuyPrice: 2780, currentPrice: 5120, holdingSince: "2024-01-08", unrealizedReturnPct: 84.2 },
    { ticker: "ADANIPOWER", companyName: "Adani Power", allocationPct: 10.7, avgBuyPrice: 410, currentPrice: 720, holdingSince: "2024-09-09", unrealizedReturnPct: 75.6 },
    { ticker: "JINDALSTEL", companyName: "Jindal Steel", allocationPct: 9.5, avgBuyPrice: 690, currentPrice: 940, holdingSince: "2025-02-03", unrealizedReturnPct: 36.2 },
    { ticker: "IRFC", companyName: "IRFC", allocationPct: 6.8, avgBuyPrice: 104, currentPrice: 149, holdingSince: "2025-03-19", unrealizedReturnPct: 43.3 },
  ],
  "ananya-sen": [
    { ticker: "ASIANPAINT", companyName: "Asian Paints", allocationPct: 17.1, avgBuyPrice: 2410, currentPrice: 2920, holdingSince: "2019-01-15", unrealizedReturnPct: 21.2 },
    { ticker: "PIDILITIND", companyName: "Pidilite Industries", allocationPct: 15.8, avgBuyPrice: 1560, currentPrice: 3090, holdingSince: "2020-06-22", unrealizedReturnPct: 98.1 },
    { ticker: "HDFCBANK", companyName: "HDFC Bank", allocationPct: 14.4, avgBuyPrice: 1245, currentPrice: 1642, holdingSince: "2021-02-18", unrealizedReturnPct: 31.9 },
    { ticker: "DMART", companyName: "Avenue Supermarts", allocationPct: 10.6, avgBuyPrice: 3090, currentPrice: 4385, holdingSince: "2022-03-07", unrealizedReturnPct: 41.9 },
  ],
  "kabir-malhotra": [
    { ticker: "SBIN", companyName: "State Bank of India", allocationPct: 19.2, avgBuyPrice: 470, currentPrice: 842, holdingSince: "2022-05-25", unrealizedReturnPct: 79.1 },
    { ticker: "NTPC", companyName: "NTPC", allocationPct: 14.5, avgBuyPrice: 158, currentPrice: 379, holdingSince: "2021-11-02", unrealizedReturnPct: 139.9 },
    { ticker: "ONGC", companyName: "ONGC", allocationPct: 12.1, avgBuyPrice: 138, currentPrice: 278, holdingSince: "2023-01-10", unrealizedReturnPct: 101.4 },
    { ticker: "GAIL", companyName: "GAIL", allocationPct: 8.8, avgBuyPrice: 96, currentPrice: 183, holdingSince: "2023-07-17", unrealizedReturnPct: 90.6 },
  ],
  "mira-dsouza": [
    { ticker: "ZOMATO", companyName: "Zomato", allocationPct: 15.7, avgBuyPrice: 92, currentPrice: 218, holdingSince: "2023-05-08", unrealizedReturnPct: 137.0 },
    { ticker: "NYKAA", companyName: "FSN E-Commerce", allocationPct: 10.8, avgBuyPrice: 146, currentPrice: 184, holdingSince: "2024-02-14", unrealizedReturnPct: 26.0 },
    { ticker: "TITAN", companyName: "Titan Company", allocationPct: 10.2, avgBuyPrice: 2380, currentPrice: 3380, holdingSince: "2021-11-18", unrealizedReturnPct: 42.0 },
    { ticker: "POLYCAB", companyName: "Polycab India", allocationPct: 9.4, avgBuyPrice: 3520, currentPrice: 6420, holdingSince: "2023-03-28", unrealizedReturnPct: 82.4 },
  ],
  "dev-narang": [
    { ticker: "RECLTD", companyName: "REC", allocationPct: 16.5, avgBuyPrice: 156, currentPrice: 512, holdingSince: "2022-04-11", unrealizedReturnPct: 228.2 },
    { ticker: "PFC", companyName: "Power Finance Corp", allocationPct: 14.0, avgBuyPrice: 118, currentPrice: 486, holdingSince: "2022-09-29", unrealizedReturnPct: 311.9 },
    { ticker: "COALINDIA", companyName: "Coal India", allocationPct: 12.2, avgBuyPrice: 190, currentPrice: 421, holdingSince: "2021-12-14", unrealizedReturnPct: 121.6 },
    { ticker: "ITC", companyName: "ITC Ltd", allocationPct: 10.4, avgBuyPrice: 261, currentPrice: 438, holdingSince: "2022-06-06", unrealizedReturnPct: 67.8 },
  ],
  "tara-gupta": [
    { ticker: "BSE", companyName: "BSE", allocationPct: 13.8, avgBuyPrice: 1040, currentPrice: 2960, holdingSince: "2023-10-10", unrealizedReturnPct: 184.6 },
    { ticker: "MAZDOCK", companyName: "Mazagon Dock", allocationPct: 11.7, avgBuyPrice: 1420, currentPrice: 4380, holdingSince: "2024-03-15", unrealizedReturnPct: 208.5 },
    { ticker: "COCHINSHIP", companyName: "Cochin Shipyard", allocationPct: 8.9, avgBuyPrice: 620, currentPrice: 1680, holdingSince: "2024-06-03", unrealizedReturnPct: 171.0 },
    { ticker: "KFINTECH", companyName: "KFin Technologies", allocationPct: 7.6, avgBuyPrice: 590, currentPrice: 1215, holdingSince: "2024-08-27", unrealizedReturnPct: 105.9 },
  ],
};

function makeTx(
  id: string,
  ticker: string,
  action: Transaction["action"],
  before: number,
  after: number,
  date: string,
  alertText?: string
): Transaction {
  return {
    id,
    ticker,
    action,
    allocationBefore: before,
    allocationAfter: after,
    price: 0,
    transactionDate: date,
    isConvictionAlert: Boolean(alertText),
    alertText,
  };
}

export const transactionsByProfile: Record<string, Transaction[]> = {
  "arjun-mehta": [
    makeTx("arj-1", "COALINDIA", "buy", 0, 9.3, "2026-06-20", "Arjun opened COALINDIA at 9.3%. New commodity conviction added."),
    makeTx("arj-2", "ITC", "add", 9.2, 14.7, "2026-04-11", "Arjun increased ITC from 9.2% to 14.7%. It moved into his top 3 holdings."),
    makeTx("arj-3", "WIPRO", "exit", 5.5, 0, "2026-02-03", "Arjun fully exited WIPRO after margins kept slipping."),
  ],
  "priya-shah": [
    makeTx("pri-1", "KAYNES", "add", 8.2, 16.8, "2026-06-18", "Priya increased KAYNES from 8.2% to 16.8%. It is now her largest holding."),
    makeTx("pri-2", "SUZLON", "exit", 6.1, 0, "2026-05-21", "Priya fully exited SUZLON after the position doubled."),
    makeTx("pri-3", "CDSL", "buy", 0, 7.5, "2026-03-05", "Priya opened CDSL at 7.5%."),
  ],
  "rahul-kapoor": [
    makeTx("rah-1", "INFY", "add", 6.0, 14.0, "2026-06-28", "Rahul increased INFY allocation from 6% to 14%. It is now his #1 holding."),
    makeTx("rah-2", "PAYTM", "exit", 8.2, 0, "2026-05-12", "Rahul fully exited PAYTM after 14 months."),
    makeTx("rah-3", "TITAN", "buy", 0, 6.5, "2026-03-02", "Rahul opened TITAN at 6.5% allocation."),
    makeTx("rah-4", "TCS", "reduce", 15.9, 13.2, "2026-01-19"),
  ],
  "neha-iyer": [
    makeTx("neh-1", "POWERGRID", "add", 5.2, 11.1, "2026-06-10", "Neha increased POWERGRID from 5.2% to 11.1%. Defensive yield moved up."),
    makeTx("neh-2", "NESTLEIND", "reduce", 20.0, 16.2, "2026-04-19"),
    makeTx("neh-3", "ITC", "add", 8.1, 14.9, "2026-02-07", "Neha increased ITC from 8.1% to 14.9%. It became her #3 holding."),
  ],
  "vikram-rao": [
    makeTx("vik-1", "ADANIPOWER", "buy", 0, 10.7, "2026-06-24", "Vikram opened ADANIPOWER at 10.7%. New momentum position."),
    makeTx("vik-2", "TRENT", "add", 8.4, 15.2, "2026-05-16", "Vikram increased TRENT from 8.4% to 15.2%. It is his largest holding."),
    makeTx("vik-3", "IRCTC", "exit", 6.0, 0, "2026-03-29", "Vikram fully exited IRCTC after trend breakdown."),
  ],
  "ananya-sen": [
    makeTx("ana-1", "PIDILITIND", "add", 9.7, 15.8, "2026-06-12", "Ananya increased PIDILITIND from 9.7% to 15.8%. Quality bucket got heavier."),
    makeTx("ana-2", "DMART", "buy", 0, 10.6, "2026-04-02", "Ananya opened DMART at 10.6%."),
    makeTx("ana-3", "MARICO", "exit", 5.4, 0, "2026-01-22", "Ananya fully exited MARICO after slower growth."),
  ],
  "kabir-malhotra": [
    makeTx("kab-1", "SBIN", "add", 12.0, 19.2, "2026-06-16", "Kabir increased SBIN from 12% to 19.2%. It became his largest holding."),
    makeTx("kab-2", "ONGC", "buy", 0, 12.1, "2026-04-27", "Kabir opened ONGC at 12.1%."),
    makeTx("kab-3", "GAIL", "reduce", 12.0, 8.8, "2026-02-18"),
  ],
  "mira-dsouza": [
    makeTx("mir-1", "ZOMATO", "add", 7.5, 15.7, "2026-06-22", "Mira increased ZOMATO from 7.5% to 15.7%. It is now her #1 holding."),
    makeTx("mir-2", "POLYCAB", "buy", 0, 9.4, "2026-05-09", "Mira opened POLYCAB at 9.4%."),
    makeTx("mir-3", "NYKAA", "reduce", 15.0, 10.8, "2026-03-17"),
  ],
  "dev-narang": [
    makeTx("dev-1", "RECLTD", "add", 9.4, 16.5, "2026-06-01", "Dev increased RECLTD from 9.4% to 16.5%. Yield plus rerating stayed intact."),
    makeTx("dev-2", "PFC", "add", 7.2, 14.0, "2026-04-13", "Dev increased PFC from 7.2% to 14%. It moved into his top 2 holdings."),
    makeTx("dev-3", "HINDZINC", "exit", 4.9, 0, "2026-02-11"),
  ],
  "tara-gupta": [
    makeTx("tar-1", "BSE", "add", 6.1, 13.8, "2026-06-26", "Tara increased BSE from 6.1% to 13.8%. It became her top conviction."),
    makeTx("tar-2", "MAZDOCK", "buy", 0, 11.7, "2026-05-18", "Tara opened MAZDOCK at 11.7%."),
    makeTx("tar-3", "IRFC", "exit", 5.7, 0, "2026-03-21", "Tara fully exited IRFC after momentum cooled."),
  ],
};

function makeGrowth(points: number[]): GrowthPoint[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return points.map((portfolio, index) => ({
    month: months[index],
    portfolio,
    nifty50: [100, 101, 103, 106, 108, 112][index],
  }));
}

export const growthByProfile: Record<string, GrowthPoint[]> = {
  "arjun-mehta": makeGrowth([100, 103, 109, 121, 128, 141]),
  "priya-shah": makeGrowth([100, 107, 118, 111, 134, 152]),
  "rahul-kapoor": makeGrowth([100, 104, 111, 118, 122, 137]),
  "neha-iyer": makeGrowth([100, 101, 103, 106, 109, 116]),
  "vikram-rao": makeGrowth([100, 112, 105, 125, 119, 146]),
  "ananya-sen": makeGrowth([100, 102, 106, 111, 117, 129]),
  "kabir-malhotra": makeGrowth([100, 99, 106, 115, 124, 132]),
  "mira-dsouza": makeGrowth([100, 108, 114, 125, 131, 149]),
  "dev-narang": makeGrowth([100, 101, 104, 108, 111, 119]),
  "tara-gupta": makeGrowth([100, 106, 102, 119, 127, 143]),
};

export const tickerFeed = [
  "ARJUN MEHTA - COALINDIA new position - 9.3%",
  "RAHUL KAPOOR - INFY 6% to 14% - now #1 holding",
  "PRIYA SHAH - full exit: SUZLON",
  "MIRA D'SOUZA - ZOMATO 7.5% to 15.7%",
  "TARA GUPTA - BSE became top conviction",
  "NEHA IYER - monthly summary posted",
  "VIKRAM RAO - new position: ADANIPOWER - 10.7%",
  "DEV NARANG - PFC moved into top 2 holdings",
];

export function getProfile(id: string): Profile | undefined {
  return profiles.find((p) => p.id === id);
}

export function getTopHoldings(profileId: string, limit = 3): Holding[] {
  return [...(holdingsByProfile[profileId] ?? [])]
    .sort((a, b) => b.allocationPct - a.allocationPct)
    .slice(0, limit);
}

export function getAlertTransactions(profileId: string): Transaction[] {
  return (transactionsByProfile[profileId] ?? []).filter((tx) => tx.isConvictionAlert);
}
