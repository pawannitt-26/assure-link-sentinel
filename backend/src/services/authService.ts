import bcrypt from 'bcryptjs';
import { getDb } from '../config/postgres.js';
import { UnauthorizedError, ConflictError, NotFoundError } from '../utils/errors.js';

const db = getDb();

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await db
      .from('users')
      .select('id, email, password_hash, full_name, created_at')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new UnauthorizedError('Invalid email or password');

    const row = data as {
      id: string;
      email: string;
      password_hash: string;
      full_name: string;
      created_at: string;
    };

    // Demo fallback: allow demo@example.com / demo123 if the password_hash is set to the literal "demo123"
    let ok = false;
    if (row.password_hash === 'demo123') {
      ok = password === 'demo123';
    } else {
      ok = await bcrypt.compare(password, row.password_hash);
    }
    if (!ok) throw new UnauthorizedError('Invalid email or password');

    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      createdAt: row.created_at,
    };
  },

  async getById(id: string): Promise<AuthUser> {
    const { data, error } = await db
      .from('users')
      .select('id, email, full_name, created_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('User not found');
    const row = data as { id: string; email: string; full_name: string; created_at: string };
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      createdAt: row.created_at,
    };
  },

  async register(email: string, password: string, fullName: string): Promise<AuthUser> {
    const lower = email.toLowerCase();
    const { data: existing } = await db.from('users').select('id').eq('email', lower).maybeSingle();
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = await bcrypt.hash(password, 10);
    const { data, error } = await db
      .from('users')
      .insert({ email: lower, password_hash: passwordHash, full_name: fullName })
      .select('id, email, full_name, created_at')
      .single();
    if (error) throw error;
    const row = data as { id: string; email: string; full_name: string; created_at: string };
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      createdAt: row.created_at,
    };
  },
};