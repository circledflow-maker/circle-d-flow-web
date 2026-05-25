-- Table for tracking "Pay what you roll" contributions and averages
create table if not exists dice_stats (
  id uuid default uuid_generate_v4() primary key,
  email text,
  rolled_value int,
  amount_paid_cents int,
  event_id text, -- e.g. 'listening-party-june-2'
  created_at timestamp with time zone default now()
);

-- Index for faster analysis
create index if not exists idx_dice_event on dice_stats(event_id);

-- Example Query for average calculation:
-- select event_id, avg(rolled_value) as avg_roll, avg(amount_paid_cents)/100 as avg_payment
-- from dice_stats
-- group by event_id;
