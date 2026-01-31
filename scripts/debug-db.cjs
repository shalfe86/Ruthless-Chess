
const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgres://postgres:r1s2t3c4g5s6@db.cpuwgjpbbgvnqdpsugkw.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

const query = `
  SELECT * FROM public.profiles;
  SELECT * FROM pg_policies WHERE tablename = 'profiles';
`;

async function run() {
    try {
        await client.connect();
        console.log('Connected to database...');

        console.log('--- PROFILES ---');
        const resProfiles = await client.query('SELECT * FROM public.profiles');
        console.table(resProfiles.rows);

        console.log('--- POLICIES ---');
        const resPolicies = await client.query("SELECT policyname, cmd, roles, qual, with_check FROM pg_policies WHERE tablename = 'profiles'");
        console.table(resPolicies.rows);

    } catch (err) {
        console.error('Debug script failed:', err);
    } finally {
        await client.end();
    }
}

run();
