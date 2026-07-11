import { z } from "zod";

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
  email: z.string().email("Valid email is required.").max(200),
  method: z.enum(["cas", "manual"]),
  holdingsText: z.string().max(50_000).optional().default(""),
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
