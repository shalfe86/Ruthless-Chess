# How to Apply Database Migrations to Supabase

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of each migration file in order:
   - `supabase/migrations/001_create_games_table.sql`
   - `supabase/migrations/002_create_moves_table.sql`
   - `supabase/migrations/003_create_player_preferences_table.sql`
5. Click **Run** for each migration

## Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link your project (one-time setup)
supabase link --project-ref YOUR_PROJECT_REF

# Apply all migrations
supabase db push
```

## Verification

After applying migrations, verify the tables were created:

1. Go to **Table Editor** in Supabase Dashboard
2. You should see three new tables:
   - `games`
   - `moves`
   - `player_preferences`

## Next Steps

Once migrations are applied:
- [ ] Update task.md to mark migrations as complete
- [ ] Begin implementing game tracking in GamePage.tsx
- [ ] Test saving games and moves to database
