import { readFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function parseEnvFile(content) {
  const env = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

async function loadEnv() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }

  const envPath = path.join(projectRoot, '.env.local');
  try {
    const envContent = await readFile(envPath, 'utf8');
    const parsed = parseEnvFile(envContent);
    for (const [key, value] of Object.entries(parsed)) {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore missing .env.local and rely on existing environment variables.
  }
}

async function main() {
  await loadEnv();

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus tersedia di environment atau .env.local.'
    );
  }

  const usersPath = path.join(projectRoot, 'database', 'user-generator.json');
  const rawUser = JSON.parse(await readFile(usersPath, 'utf8'));

  const fileUser = Array.isArray(rawUser) ? rawUser[0] : rawUser;
  const rl = readline.createInterface({ input, output });

  const ask = async (question, defaultValue = '') => {
    const suffix = defaultValue ? ` (${defaultValue})` : '';
    const answer = await rl.question(`${question}${suffix}: `);
    return answer.trim() || defaultValue;
  };

  let user = fileUser;

  if (!user || typeof user !== 'object' || Array.isArray(user)) {
    user = {};
  }

  const username = (await ask('Username', typeof user.username === 'string' ? user.username.trim() : ''));
  const password = await ask('Password', typeof user.password === 'string' ? user.password : '');
  const fullName = await ask('Full name', typeof user.fullName === 'string' ? user.fullName.trim() : '');
  const activeAnswer = await ask(
    'Aktif? (y/n)',
    typeof user.isActive === 'boolean' ? (user.isActive ? 'y' : 'n') : 'y'
  );

  rl.close();

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const isActive = /^y(es)?$/i.test(activeAnswer);

  if (!username || !password || !fullName) {
    throw new Error('User harus memiliki username, password, dan fullName.');
  }

  const passwordSalt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto
    .scryptSync(password, passwordSalt, 64)
    .toString('hex');

  const { error: deleteError } = await supabase.from('app_users').delete().gt('id', 0);
  if (deleteError) {
    throw deleteError;
  }

  const { error: insertError } = await supabase.from('app_users').insert({
    username,
    full_name: fullName,
    is_active: isActive,
    password_hash: passwordHash,
    password_salt: passwordSalt,
  });

  if (insertError) {
    throw insertError;
  }

  console.log('Berhasil sinkron 1 user dari database/user-generator.json');
}

main().catch((error) => {
  console.error('Gagal menjalankan user generator:', error);
  process.exitCode = 1;
});