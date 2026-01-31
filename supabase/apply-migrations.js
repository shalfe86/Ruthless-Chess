#!/usr/bin/env node

/**
 * Apply Supabase Migrations Script
 * This script reads the SQL migration file and applies it to your Supabase database
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://cpuwgjpbbgvnqdpsugkw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwdXdnanBiYmd2bnFkcHN1Z2t3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM3OTkzOCwiZXhwIjoyMDg0OTU1OTM4fQ.qkjRdYsZpCfN88VmS_lwopOE4-v6I_7MohwQ4wCl7BY';

// Read the migration file
const migrationPath = path.join(__dirname, 'migrations', 'PHASE_1_ALL_MIGRATIONS.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

console.log(`📝 Read migration file: ${migrationPath}\n`);
console.log(`📊 File size: ${sql.length} characters\n`);

// Function to execute SQL via Supabase REST API
function executeSQL(sqlQuery) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ query: sqlQuery });

        const options = {
            hostname: 'cpuwgjpbbgvnqdpsugkw.supabase.co',
            port: 443,
            path: '/rest/v1/rpc/query',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Prefer': 'return=representation',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log(`Response Status: ${res.statusCode}`);
                console.log(`Response: ${data}\n`);

                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ success: true, data });
                } else {
                    resolve({ success: false, error: data, statusCode: res.statusCode });
                }
            });
        });

        req.on('error', (error) => {
            reject({ success: false, error: error.message });
        });

        req.write(postData);
        req.end();
    });
}

// Apply migrations
async function applyMigrations() {
    console.log('🚀 Attempting to apply migrations via REST API...\n');

    try {
        const result = await executeSQL(sql);

        if (result.success) {
            console.log('✅ Migrations applied successfully!');
        } else {
            console.log('❌ Migration failed via REST API');
            console.log('\n⚠️  Supabase REST API does not support direct SQL execution.');
            console.log('\n📋 Please apply migrations manually:');
            console.log('   1. Go to: https://supabase.com/dashboard/project/cpuwgjpbbgvnqdpsugkw/sql/new');
            console.log('   2. Copy the contents of: supabase/migrations/PHASE_1_ALL_MIGRATIONS.sql');
            console.log('   3. Paste into the SQL Editor');
            console.log('   4. Click "Run" or press Cmd+Enter\n');
        }
    } catch (error) {
        console.log('❌ Error:', error.error || error.message);
        console.log('\n📋 Please apply migrations manually (see instructions above)\n');
    }
}

applyMigrations().catch(console.error);
