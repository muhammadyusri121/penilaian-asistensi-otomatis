import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface GeneratorUser {
  username: string;
  password: string;
  fullName: string;
  isActive?: boolean;
}

function getUserFilePath() {
  return path.join(process.cwd(), 'database', 'user-generator.json');
}

export async function getGeneratorUser(): Promise<GeneratorUser | null> {
  try {
    const raw = await readFile(getUserFilePath(), 'utf8');
    const parsed = JSON.parse(raw) as GeneratorUser;

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed) ||
      typeof parsed.username !== 'string' ||
      typeof parsed.password !== 'string' ||
      typeof parsed.fullName !== 'string'
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}