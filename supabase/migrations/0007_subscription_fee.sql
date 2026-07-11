alter table profiles
  add column if not exists subscription_fee_inr numeric not null default 0;

-- Ensure positive subscription fees
alter table profiles
  add constraint subscription_fee_inr_check check (subscription_fee_inr >= 0);
