export type BrokerProvider = "zerodha" | "groww" | "angel_one" | "upstox" | "icici_direct";

export interface BrokerConnection {
  id: string;
  provider: BrokerProvider;
  accountLabel?: string;
  status: "awaiting_authorization" | "active" | "revoked" | "error";
  lastSyncedAt?: string;
}

export interface NormalizedHolding {
  symbol: string;
  quantity: number;
  averagePrice?: number;
  marketValue?: number;
  asOf: string;
}

export interface NormalizedTransaction {
  externalId: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price?: number;
  occurredAt: string;
}

export interface PortfolioImporter { import(connection: BrokerConnection): Promise<NormalizedHolding[]>; }
export interface TransactionImporter { import(connection: BrokerConnection, since?: Date): Promise<NormalizedTransaction[]>; }
export interface PortfolioNormalizer { normalize(input: unknown): NormalizedHolding[]; }

export interface BrokerAdapter {
  readonly provider: BrokerProvider;
  authorize(input: { userId: string; redirectUri: string }): Promise<string>;
  portfolioImporter: PortfolioImporter;
  transactionImporter: TransactionImporter;
  portfolioNormalizer: PortfolioNormalizer;
}
