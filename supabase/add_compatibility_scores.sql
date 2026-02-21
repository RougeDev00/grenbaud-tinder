-- Create a table to store shared compatibility scores
create table if not exists compatibility_scores (
    id uuid default gen_random_uuid() primary key,
    user_a uuid references profiles(id) on delete cascade not null,
    user_b uuid references profiles(id) on delete cascade not null,
    score int not null,
    explanation text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Ensure user_a is always 'smaller' than user_b to enforce unique pairs
    constraint users_ordered check (user_a < user_b),
    constraint unique_pair unique (user_a, user_b)
);

-- Enable RLS
alter table compatibility_scores enable row level security;

-- Policy: Everyone can read scores (since they are public metrics in the app)
create policy "Everyone can read compatibility scores"
    on compatibility_scores for select
    using (true);

-- Policy: Authenticated users can insert scores
create policy "Authenticated users can insert scores"
    on compatibility_scores for insert
    with check (auth.role() = 'authenticated');
