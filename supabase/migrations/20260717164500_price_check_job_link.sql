alter table public.price_checks
add column if not exists source_job_id uuid references public.jobs(id) on delete set null;

create unique index if not exists price_checks_source_job_id_idx
on public.price_checks(source_job_id);
