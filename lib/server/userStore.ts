import { getDb } from '@/lib/db';
import type { AppUser } from '@/lib/userTypes';

interface UserRow {
  id: number;
  username: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

interface AuthUserRow {
  username: string;
  is_active: boolean;
  password_hash: string;
  password_salt: string;
}

export interface AuthUser {
  username: string;
  isActive: boolean;
  passwordHash: string;
  passwordSalt: string;
}

function mapUser(row: UserRow): AppUser {
  return {
    id: String(row.id),
    username: row.username,
    fullName: row.full_name,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export async function getUsers(): Promise<AppUser[]> {
  const db = getDb();
  const result = await db
    .from('app_users')
    .select('id, username, full_name, is_active, created_at')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });

  if (result.error) throw result.error;
  return (result.data || []).map((row) => mapUser(row as UserRow));
}

export async function getAuthUserByUsername(username: string): Promise<AuthUser | null> {
  const db = getDb();
  const result = await db
    .from('app_users')
    .select('username, is_active, password_hash, password_salt')
    .eq('username', username)
    .limit(1)
    .maybeSingle();

  if (result.error) throw result.error;
  if (!result.data) return null;

  const row = result.data as AuthUserRow;
  return {
    username: row.username,
    isActive: row.is_active,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
  };
}

export async function getUserByUsername(username: string): Promise<AppUser | null> {
  const db = getDb();
  const result = await db
    .from('app_users')
    .select('id, username, full_name, is_active, created_at')
    .eq('username', username)
    .limit(1)
    .maybeSingle();

  if (result.error) throw result.error;
  if (!result.data) return null;

  return mapUser(result.data as UserRow);
}

export async function updateUserPassword(
  username: string,
  passwordHash: string,
  passwordSalt: string
): Promise<boolean> {
  const db = getDb();
  const result = await db
    .from('app_users')
    .update({
      password_hash: passwordHash,
      password_salt: passwordSalt,
    })
    .eq('username', username)
    .select('username')
    .limit(1)
    .maybeSingle();

  if (result.error) throw result.error;
  return Boolean(result.data);
}