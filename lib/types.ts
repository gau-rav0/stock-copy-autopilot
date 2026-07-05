export type InvestingStyle =
  | "value"
  | "growth"
  | "dividend"
  | "momentum"
  | "smallcap"
  | "longterm";

export type VerificationTier = "demo" | "cas" | "broker" | "auto";

export interface Profile {
  id: string;
  displayName: string;
  bio: string;
  photoUrl: string;
  investingStyle: InvestingStyle;
  isDemo: boolean;
  verified: boolean;
  verificationTier: VerificationTier;
  followerCount: number;
  cagr: number;
  xirr: number;
  alpha: number;
  maxDrawdown: number;
  volatility: number;
  winRate: number;
}

export interface Holding {
  ticker: string;
  companyName: string;
  allocationPct: number;
  avgBuyPrice: number;
  currentPrice: number;
  holdingSince: string;
  unrealizedReturnPct: number;
}

export type TransactionAction = "buy" | "add" | "reduce" | "exit";

export interface Transaction {
  id: string;
  ticker: string;
  action: TransactionAction;
  allocationBefore: number;
  allocationAfter: number;
  price: number;
  transactionDate: string;
  isConvictionAlert: boolean;
  alertText?: string;
}

export interface GrowthPoint {
  month: string;
  portfolio: number;
  nifty50: number;
}
