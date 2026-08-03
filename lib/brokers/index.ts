import type { BrokerAdapter, BrokerProvider } from "./types";

const providers: BrokerProvider[] = ["zerodha", "groww", "angel_one", "upstox", "icici_direct"];

/** Provider registry. Adapters are registered as OAuth/API integrations are enabled. */
export function supportedBrokerProviders(): readonly BrokerProvider[] { return providers; }
export function getBrokerAdapter(provider: BrokerProvider): BrokerAdapter {
  throw new Error(`Broker adapter for ${provider} is not configured yet`);
}

export type { BrokerAdapter, BrokerConnection, BrokerProvider, NormalizedHolding, NormalizedTransaction, PortfolioImporter, PortfolioNormalizer, TransactionImporter } from "./types";
