alter table public.orders
  add column if not exists customer_phone text;

comment on column public.orders.customer_phone is 'Optional customer phone for manual and synced orders.';
