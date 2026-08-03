-- Production capture fields and database-enforced duplicate protection.
alter table waitlist_signups add column if not exists ip text, add column if not exists user_agent text, add column if not exists referrer text;
create unique index if not exists waitlist_signups_email_lower_idx on waitlist_signups (lower(email));

alter table creator_applications add column if not exists name text, add column if not exists twitter text, add column if not exists linkedin text, add column if not exists youtube text, add column if not exists broker text, add column if not exists aum text, add column if not exists followers text, add column if not exists proof_url text, add column if not exists notes text, add column if not exists review_notes text;
alter table creator_applications drop constraint if exists creator_applications_status_check;
update creator_applications set status = 'Pending' where status = 'pending_review';
update creator_applications set status = 'Accepted' where status = 'approved';
alter table creator_applications add constraint creator_applications_status_check check (status in ('Pending', 'Accepted', 'Rejected', 'Need Proof'));
alter table creator_applications alter column status set default 'Pending';
create unique index if not exists creator_applications_email_lower_idx on creator_applications (lower(email));
