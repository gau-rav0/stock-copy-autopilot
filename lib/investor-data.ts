import {
  getAlertTransactions as getDemoAlertTransactions,
  getProfile as getDemoProfile,
  getTopHoldings as getDemoTopHoldings,
  growthByProfile,
  holdingsByProfile,
  profiles as demoProfiles,
  tickerFeed as demoTickerFeed,
  transactionsByProfile,
} from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import { GrowthPoint, Holding, InvestingStyle, Profile, Transaction, TransactionAction, VerificationTier } from "@/lib/types";

type ProfileRow = {
  id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  photo_url: string | null;
  investing_style: InvestingStyle;
  verified: boolean;
  verification_tier: VerificationTier;
  follower_count: number;
  cagr: number;
  xirr: number;
  alpha: number;
  max_drawdown: number;
  volatility: number;
  win_rate: number;
  sort_order: number;
};

type PortfolioRow = {
  id: string;
  profile_id: string;
  is_demo: boolean;
};

type HoldingRow = {
  ticker: string;
  company_name: string | null;
  allocation_pct: number;
  avg_buy_price: number | null;
  current_price: number | null;
  holding_since: string | null;
  unrealized_return_pct: number | null;
};

type TransactionRow = {
  id: string;
  ticker: string;
  action: TransactionAction;
  allocation_before: number;
  allocation_after: number;
  price: number | null;
  transaction_date: string;
  is_conviction_alert: boolean;
  alert_text: string | null;
};

type GrowthRow = {
  month: string;
  portfolio: number;
  nifty50: number;
  sort_order: number;
};

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function toProfile(row: ProfileRow, topHoldings: Holding[] = []): Profile {
  return {
    id: row.slug,
    displayName: row.display_name,
    bio: row.bio ?? "",
    photoUrl: row.photo_url ?? "",
    investingStyle: row.investing_style,
    isDemo: true,
    verified: row.verified,
    verificationTier: row.verification_tier,
    followerCount: toNumber(row.follower_count),
    cagr: toNumber(row.cagr),
    xirr: toNumber(row.xirr),
    alpha: toNumber(row.alpha),
    maxDrawdown: toNumber(row.max_drawdown),
    volatility: toNumber(row.volatility),
    winRate: toNumber(row.win_rate),
    topHoldings,
  };
}

function toHolding(row: HoldingRow): Holding {
  return {
    ticker: row.ticker,
    companyName: row.company_name ?? row.ticker,
    allocationPct: toNumber(row.allocation_pct),
    avgBuyPrice: toNumber(row.avg_buy_price),
    currentPrice: toNumber(row.current_price),
    holdingSince: row.holding_since ?? "",
    unrealizedReturnPct: toNumber(row.unrealized_return_pct),
  };
}

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    ticker: row.ticker,
    action: row.action,
    allocationBefore: toNumber(row.allocation_before),
    allocationAfter: toNumber(row.allocation_after),
    price: toNumber(row.price),
    transactionDate: row.transaction_date,
    isConvictionAlert: row.is_conviction_alert,
    alertText: row.alert_text ?? undefined,
  };
}

function toGrowth(row: GrowthRow): GrowthPoint {
  return {
    month: row.month,
    portfolio: toNumber(row.portfolio),
    nifty50: toNumber(row.nifty50),
  };
}

export async function getProfiles(): Promise<Profile[]> {
  const supabase = createClient();
  if (!supabase) {
    return demoProfiles.map((profile) => ({ ...profile, topHoldings: getDemoTopHoldings(profile.id) }));
  }

  const { data: profileRows, error } = await supabase
    .from("profiles")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !profileRows?.length) {
    return demoProfiles.map((profile) => ({ ...profile, topHoldings: getDemoTopHoldings(profile.id) }));
  }

  const portfolioByProfile = await getPortfolioMap(profileRows.map((profile) => profile.id));
  const holdingsByPortfolio = await getHoldingsMap([...portfolioByProfile.values()].map((portfolio) => portfolio.id));

  return (profileRows as ProfileRow[]).map((profile) => {
    const portfolio = portfolioByProfile.get(profile.id);
    const topHoldings = portfolio ? holdingsByPortfolio.get(portfolio.id) ?? [] : [];
    return toProfile(profile, topHoldings.length > 0 ? topHoldings.slice(0, 3) : getDemoTopHoldings(profile.slug));
  });
}

export async function getProfileDetail(slug: string) {
  const supabase = createClient();
  if (!supabase) {
    const profile = getDemoProfile(slug);
    return profile
      ? {
          profile,
          holdings: holdingsByProfile[slug] ?? [],
          transactions: transactionsByProfile[slug] ?? [],
          growth: growthByProfile[slug] ?? [],
          alerts: getDemoAlertTransactions(slug),
        }
      : null;
  }

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("slug", slug).maybeSingle();
  if (error || !profile) {
    const demoProfile = getDemoProfile(slug);
    return demoProfile
      ? {
          profile: demoProfile,
          holdings: holdingsByProfile[slug] ?? [],
          transactions: transactionsByProfile[slug] ?? [],
          growth: growthByProfile[slug] ?? [],
          alerts: getDemoAlertTransactions(slug),
        }
      : null;
  }

  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("*")
    .eq("profile_id", profile.id)
    .eq("name", "Primary")
    .maybeSingle();

  if (!portfolio) {
    return { profile: toProfile(profile as ProfileRow), holdings: [], transactions: [], growth: [], alerts: [] };
  }

  const [{ data: holdings }, { data: transactions }, { data: growth }] = await Promise.all([
    supabase.from("holdings").select("*").eq("portfolio_id", portfolio.id).order("allocation_pct", { ascending: false }),
    supabase.from("transactions").select("*").eq("portfolio_id", portfolio.id).order("transaction_date", { ascending: false }),
    supabase.from("portfolio_growth").select("*").eq("portfolio_id", portfolio.id).order("sort_order", { ascending: true }),
  ]);

  const mappedHoldings = ((holdings ?? []) as HoldingRow[]).map(toHolding);
  const mappedTransactions = ((transactions ?? []) as TransactionRow[]).map(toTransaction);
  const mappedGrowth = ((growth ?? []) as GrowthRow[]).map(toGrowth);
  const fallbackProfile = getDemoProfile(slug);

  return {
    profile: toProfile(
      profile as ProfileRow,
      mappedHoldings.length > 0 ? mappedHoldings.slice(0, 3) : getDemoTopHoldings(slug)
    ),
    holdings: mappedHoldings.length > 0 ? mappedHoldings : holdingsByProfile[slug] ?? [],
    transactions: mappedTransactions.length > 0 ? mappedTransactions : transactionsByProfile[slug] ?? [],
    growth: mappedGrowth.length > 0 ? mappedGrowth : growthByProfile[slug] ?? [],
    alerts:
      mappedTransactions.length > 0
        ? mappedTransactions.filter((transaction) => transaction.isConvictionAlert)
        : fallbackProfile
          ? getDemoAlertTransactions(slug)
          : [],
  };
}

export async function getHomeData() {
  const profiles = await getProfiles();
  const rahul = await getProfileDetail("rahul-kapoor");

  return {
    featured: profiles.slice(0, 3),
    replaySample: rahul?.transactions.slice(0, 3) ?? transactionsByProfile["rahul-kapoor"].slice(0, 3),
  };
}

export async function getTickerFeed() {
  const supabase = createClient();
  if (!supabase) return demoTickerFeed;

  const { data, error } = await supabase
    .from("transactions")
    .select("ticker, alert_text, transaction_date")
    .eq("is_conviction_alert", true)
    .order("transaction_date", { ascending: false })
    .limit(8);

  if (error || !data?.length) return demoTickerFeed;

  return data.map((item) => item.alert_text ?? `${item.ticker} allocation changed`);
}

async function getPortfolioMap(profileIds: string[]) {
  const supabase = createClient();
  const portfolioByProfile = new Map<string, PortfolioRow>();
  if (!supabase || profileIds.length === 0) return portfolioByProfile;

  const { data } = await supabase
    .from("portfolios")
    .select("*")
    .in("profile_id", profileIds)
    .eq("name", "Primary");

  ((data ?? []) as PortfolioRow[]).forEach((portfolio) => portfolioByProfile.set(portfolio.profile_id, portfolio));
  return portfolioByProfile;
}

async function getHoldingsMap(portfolioIds: string[]) {
  const supabase = createClient();
  const holdingsByPortfolio = new Map<string, Holding[]>();
  if (!supabase || portfolioIds.length === 0) return holdingsByPortfolio;

  const { data } = await supabase
    .from("holdings")
    .select("portfolio_id,ticker,company_name,allocation_pct,avg_buy_price,current_price,holding_since,unrealized_return_pct")
    .in("portfolio_id", portfolioIds)
    .order("allocation_pct", { ascending: false });

  (data ?? []).forEach((row) => {
    const portfolioId = row.portfolio_id as string;
    const holdings = holdingsByPortfolio.get(portfolioId) ?? [];
    holdings.push(toHolding(row as HoldingRow));
    holdingsByPortfolio.set(portfolioId, holdings);
  });

  return holdingsByPortfolio;
}
