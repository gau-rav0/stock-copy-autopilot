-- Epic 4: Email Alert Engine
-- Enable pg_net to send HTTP requests from PostgreSQL
create extension if not exists pg_net;

-- Create the trigger function
create or replace function public.handle_conviction_alert()
returns trigger as $$
declare
  -- The URL of the Next.js API endpoint.
  api_url text := current_setting('app.settings.blast_alert_url', true);
  secret_key text := current_setting('app.settings.blast_alert_secret', true);
begin
  -- Provide a default local URL if not configured
  if api_url is null or api_url = '' then
    api_url := 'http://host.docker.internal:3000/api/internal/blast-alert';
  end if;
  
  if secret_key is null then
    secret_key := 'development_secret_key';
  end if;

  perform net.http_post(
    url := api_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || secret_key
    ),
    body := row_to_json(NEW)::jsonb
  );

  return NEW;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists to make it idempotent
drop trigger if exists conviction_alert_trigger on public.transactions;

-- Create the trigger on the transactions table
create trigger conviction_alert_trigger
after insert on public.transactions
for each row
when (NEW.is_conviction_alert = true)
execute function public.handle_conviction_alert();
