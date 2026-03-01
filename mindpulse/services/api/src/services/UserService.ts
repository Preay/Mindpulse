import bcryptjs from 'bcryptjs';
import { Pool } from 'pg';
import { User, UserRegistrationRequest } from '@mindpulse/shared-types';
import { generateAccessToken, generateRefreshToken, hashRefreshToken } from '../utils/auth';

export class UserService {
  constructor(private db: Pool) {}

  async register(req: UserRegistrationRequest): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const { email, password } = req;

    // Check if user exists
    const existingUser = await this.db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('USER_ALREADY_EXISTS');
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10);

    // Create user
    const result = await this.db.query(
      `INSERT INTO users (email, password_hash, plan_tier, timezone, checkin_time)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, plan_tier, timezone, checkin_time, org_id, created_at, updated_at`,
      [email.toLowerCase(), passwordHash, 'free', 'UTC', '12:00:00']
    );

    const user = result.rows[0] as User;

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.plan_tier, user.org_id);
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);

    // Store refresh token
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await this.db.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshTokenHash, expiresAt]
    );

    return { user, accessToken, refreshToken };
  }

  async login(email: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    // Find user
    const result = await this.db.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcryptjs.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.plan_tier, user.org_id);
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);

    // Store refresh token
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await this.db.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshTokenHash, expiresAt]
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        plan_tier: user.plan_tier,
        timezone: user.timezone,
        checkin_time: user.checkin_time,
        org_id: user.org_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      accessToken,
      refreshToken,
    };
  }

  async getUserById(userId: string): Promise<User> {
    const result = await this.db.query(
      'SELECT id, email, plan_tier, timezone, checkin_time, org_id, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    return result.rows[0] as User;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const allowedFields = ['timezone', 'checkin_time'];
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(value);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return this.getUserById(userId);
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(userId);

    const result = await this.db.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING id, email, plan_tier, timezone, checkin_time, org_id, created_at, updated_at`,
      updateValues
    );

    return result.rows[0] as User;
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const refreshTokenHash = hashRefreshToken(refreshToken);
    await this.db.query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND token_hash = $2',
      [userId, refreshTokenHash]
    );
  }

  async logoutAll(userId: string): Promise<void> {
    await this.db.query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1', [userId]);
  }

  async deleteUser(userId: string): Promise<void> {
    // This will cascade delete all related data due to ON DELETE CASCADE constraints
    await this.db.query('DELETE FROM users WHERE id = $1', [userId]);
  }
}
