create table if not exists company_submissions (
  id text primary key,
  name_ar text not null default '',
  name_en text not null default '',
  norm_en text not null default '',
  norm_ar text not null default '',
  banks text not null,
  notes text not null default '',
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected')),
  decision_note text not null default '',
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists company_submissions_status_idx on company_submissions (status);
create index if not exists company_submissions_norm_en_idx on company_submissions (norm_en);

create table if not exists company_audit (
  id serial primary key,
  at timestamptz not null default now(),
  action text not null,
  submission_id text not null,
  detail text not null default ''
);
