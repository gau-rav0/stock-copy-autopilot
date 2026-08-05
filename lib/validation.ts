import { z } from "zod";

// Users naturally type "twitter.com/handle" instead of "https://twitter.com/handle".
// Prepend a scheme before validating so bare domains don't fail z.string().url().
const normalizeUrlOrEmpty = (val: unknown) => {
  if (typeof val !== "string") return val;
  const trimmed = val.trim();
  if (trimmed === "") return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const optionalUrlField = () =>
  z.preprocess(normalizeUrlOrEmpty, z.string().url().max(500).or(z.literal(""))).optional().default("");

export const HoldingInputSchema = z.object({
  stock_symbol: z.string().min(1).max(20),
  qty: z.coerce.number().positive(),
  avg_buy_price: z.coerce.number().positive(),
  buy_date: z.string().max(10).optional().default(""),
});

export const RoastRequestSchema = z.object({
  displayName: z.string().max(100).optional().default(""),
  email: z.string().email().max(200).optional().or(z.literal("")),
  holdings: z.array(HoldingInputSchema).min(1, "Add at least one holding.").max(10),
});

export const CreatorApplicationSchema = z.object({
  creatorName: z.string().max(100).optional().default(""),
  name: z.string().max(100).optional(),
  email: z.string().email("Valid email is required.").max(200),
  twitter: optionalUrlField(),
  linkedin: optionalUrlField(),
  youtube: optionalUrlField(),
  broker: z.string().max(100).optional().or(z.literal("")),
  aum: z.string().max(100).optional().or(z.literal("")),
  followers: z.string().max(100).optional().or(z.literal("")),
  proof_url: optionalUrlField(),
  notes: z.string().max(5000).optional().or(z.literal("")),
  method: z.enum(["cas", "manual"]),
  holdingsText: z.string().max(50_000).optional().default(""),
});

export const WaitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email("Valid email is required.").max(200),
  source: z.string().trim().max(100).default("founding_access"),
});

export const FollowIntentSchema = z.object({
  investorId: z.string().max(100).optional(),
  investorName: z.string().max(200).optional(),
  email: z.string().email().max(200).optional().or(z.literal("")),
  source: z.string().max(50).optional().default("follow_button"),
}).refine(
  (data) => data.investorName || data.investorId,
  { message: "Investor is required." }
);
