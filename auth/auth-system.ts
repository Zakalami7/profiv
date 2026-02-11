/**
 * Authentication System
 * JWT-based authentication replacing Supabase Auth
 * Features: Password hashing, token generation, session management
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { authUsers, profiles, DbResult } from '../database/database-adapter';
import { getDatabase } from '../database/connection.js';

// Configuration
const AUTH_CONFIG = {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    jwtExpiresIn: '7d', // Token expiration
    saltRounds: 12, // bcrypt salt rounds
    refreshTokenExpiresIn: '30d',
};

// Types
export interface AuthUser {
    id: string;
    email: string;
    email_confirmed: boolean;
    created_at: string;
    last_sign_in_at?: string;
    user_metadata?: Record<string, any>;
}

export interface UserCredentials {
    email: string;
    password: string;
}

export interface SignUpData extends UserCredentials {
    preferred_cycle?: string;
    school_name?: string;
    full_name?: string;
}

export interface AuthResponse {
    user: AuthUser | null;
    session: {
        access_token: string;
        refresh_token: string;
        expires_at: number;
    } | null;
    error: Error | null;
}

// Helper functions
const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, AUTH_CONFIG.saltRounds);
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

const generateTokens = (userId: string): { accessToken: string; refreshToken: string; expiresAt: number } => {
    const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
    
    const accessToken = jwt.sign(
        { sub: userId, type: 'access' },
        AUTH_CONFIG.jwtSecret,
        { expiresIn: AUTH_CONFIG.jwtExpiresIn }
    );
    
    const refreshToken = jwt.sign(
        { sub: userId, type: 'refresh' },
        AUTH_CONFIG.jwtSecret,
        { expiresIn: AUTH_CONFIG.refreshTokenExpiresIn }
    );
    
    return { accessToken, refreshToken, expiresAt };
};

const verifyToken = (token: string): { sub: string; type: string } | null => {
    try {
        const decoded = jwt.verify(token, AUTH_CONFIG.jwtSecret) as { sub: string; type: string };
        return decoded;
    } catch (error) {
        return null;
    }
};

// Main authentication functions
export const signUp = async (data: SignUpData): Promise<AuthResponse> => {
    try {
        const { email, password, preferred_cycle, school_name, full_name } = data;
        
        // Check if user already exists
        const adapter = authUsers();
        const existingUser = await adapter.selectSingle('*', {
            filters: [adapter.eq('email', email)]
        });

        if (existingUser.data) {
            return {
                user: null,
                session: null,
                error: new Error('User already exists'),
            };
        }
        
        // Hash password
        const hashedPassword = await hashPassword(password);
        
        // Create user
        const userId = uuidv4();
        const now = new Date().toISOString();
        
        const { error: userError } = await authUsers().insert({
            id: userId,
            email,
            encrypted_password: hashedPassword,
            email_confirmed: false,
            created_at: now,
            updated_at: now,
            user_metadata: JSON.stringify({
                preferred_cycle,
                school_name,
                full_name,
            }),
        });
        
        if (userError) {
            throw userError;
        }
        
        // Create profile
        const { error: profileError } = await profiles().insert({
            id: userId,
            email,
            plan: 'FREE',
            daily_credits: 3,
            last_refill_date: now.split('T')[0],
            preferred_cycle: preferred_cycle || null,
            school_name: school_name || null,
            full_name: full_name || null,
            created_at: now,
        });
        
        if (profileError) {
            // Rollback user creation
            const adapter = authUsers();
            await adapter.delete([adapter.eq('id', userId)]);
            throw profileError;
        }
        
        // Generate tokens
        const { accessToken, refreshToken, expiresAt } = generateTokens(userId);
        
        const user: AuthUser = {
            id: userId,
            email,
            email_confirmed: false,
            created_at: now,
            user_metadata: {
                preferred_cycle,
                school_name,
                full_name,
            },
        };
        
        return {
            user,
            session: {
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: expiresAt,
            },
            error: null,
        };
        
    } catch (error) {
        return {
            user: null,
            session: null,
            error: error instanceof Error ? error : new Error('Sign up failed'),
        };
    }
};

export const signIn = async (credentials: UserCredentials): Promise<AuthResponse> => {
    try {
        const { email, password } = credentials;
        
        // Find user
        const adapter = authUsers();
        const { data: user, error: userError } = await adapter.selectSingle('*', {
            filters: [adapter.eq('email', email)]
        });
        
        if (userError || !user) {
            return {
                user: null,
                session: null,
                error: new Error('Invalid credentials'),
            };
        }
        
        // Verify password
        const isValid = await verifyPassword(password, user.encrypted_password);
        if (!isValid) {
            return {
                user: null,
                session: null,
                error: new Error('Invalid credentials'),
            };
        }
        
        // Update last sign in
        const now = new Date().toISOString();
        await adapter.update(
            { last_sign_in_at: now },
            [adapter.eq('id', user.id)]
        );
        
        // Generate tokens
        const { accessToken, refreshToken, expiresAt } = generateTokens(user.id);
        
        const authUser: AuthUser = {
            id: user.id,
            email: user.email,
            email_confirmed: user.email_confirmed,
            created_at: user.created_at,
            last_sign_in_at: now,
            user_metadata: user.user_metadata ? JSON.parse(user.user_metadata) : {},
        };
        
        return {
            user: authUser,
            session: {
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: expiresAt,
            },
            error: null,
        };
        
    } catch (error) {
        return {
            user: null,
            session: null,
            error: error instanceof Error ? error : new Error('Sign in failed'),
        };
    }
};

export const signOut = async (token: string): Promise<{ error: Error | null }> => {
    try {
        // In a more complex system, you might want to blacklist the token
        // For now, we just verify it was valid
        const decoded = verifyToken(token);
        if (!decoded) {
            return { error: new Error('Invalid token') };
        }
        
        return { error: null };
    } catch (error) {
        return {
            error: error instanceof Error ? error : new Error('Sign out failed'),
        };
    }
};

export const refreshSession = async (refreshToken: string): Promise<AuthResponse> => {
    try {
        const decoded = verifyToken(refreshToken);
        if (!decoded || decoded.type !== 'refresh') {
            return {
                user: null,
                session: null,
                error: new Error('Invalid refresh token'),
            };
        }
        
        // Get user
        const adapter = authUsers();
        const { data: user, error: userError } = await adapter.selectSingle('*', {
            filters: [adapter.eq('id', decoded.sub)]
        });
        
        if (userError || !user) {
            return {
                user: null,
                session: null,
                error: new Error('User not found'),
            };
        }
        
        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken, expiresAt } = generateTokens(user.id);
        
        const authUser: AuthUser = {
            id: user.id,
            email: user.email,
            email_confirmed: user.email_confirmed,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            user_metadata: user.user_metadata ? JSON.parse(user.user_metadata) : {},
        };
        
        return {
            user: authUser,
            session: {
                access_token: accessToken,
                refresh_token: newRefreshToken,
                expires_at: expiresAt,
            },
            error: null,
        };
        
    } catch (error) {
        return {
            user: null,
            session: null,
            error: error instanceof Error ? error : new Error('Session refresh failed'),
        };
    }
};

export const getUser = async (token: string): Promise<{ user: AuthUser | null; error: Error | null }> => {
    try {
        const decoded = verifyToken(token);
        if (!decoded) {
            return { user: null, error: new Error('Invalid token') };
        }
        
        const adapter = authUsers();
        const { data: user, error: userError } = await adapter.selectSingle('*', {
            filters: [adapter.eq('id', decoded.sub)]
        });
        
        if (userError || !user) {
            return { user: null, error: new Error('User not found') };
        }
        
        const authUser: AuthUser = {
            id: user.id,
            email: user.email,
            email_confirmed: user.email_confirmed,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            user_metadata: user.user_metadata ? JSON.parse(user.user_metadata) : {},
        };
        
        return { user: authUser, error: null };
        
    } catch (error) {
        return {
            user: null,
            error: error instanceof Error ? error : new Error('Failed to get user'),
        };
    }
};

export const updateUser = async (
    token: string,
    updates: Partial<AuthUser>
): Promise<{ user: AuthUser | null; error: Error | null }> => {
    try {
        const decoded = verifyToken(token);
        if (!decoded) {
            return { user: null, error: new Error('Invalid token') };
        }
        
        const now = new Date().toISOString();
        const updateData: Record<string, any> = {
            updated_at: now,
        };
        
        if (updates.email) updateData.email = updates.email;
        if (updates.user_metadata) updateData.user_metadata = JSON.stringify(updates.user_metadata);
        
        const adapter = authUsers();
        const { error: updateError } = await adapter.update(
            updateData,
            [adapter.eq('id', decoded.sub)]
        );
        
        if (updateError) {
            throw updateError;
        }
        
        // Get updated user
        return await getUser(token);
        
    } catch (error) {
        return {
            user: null,
            error: error instanceof Error ? error : new Error('Failed to update user'),
        };
    }
};

export const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
    try {
        // In a real implementation, you would:
        // 1. Generate a reset token
        // 2. Store it in the database with expiration
        // 3. Send an email with the reset link
        
        // For now, just verify the user exists
        const adapter = authUsers();
        const { data: user, error: userError } = await adapter.selectSingle('id', {
            filters: [adapter.eq('email', email)]
        });
        
        if (userError || !user) {
            // Don't reveal if user exists or not for security
            return { error: null };
        }
        
        // TODO: Implement email sending
        console.log(`Password reset requested for ${email}`);
        
        return { error: null };
        
    } catch (error) {
        return {
            error: error instanceof Error ? error : new Error('Password reset failed'),
        };
    }
};

// Middleware for protecting routes
export const requireAuth = async (token: string): Promise<{ user: AuthUser | null; error: Error | null }> => {
    return await getUser(token);
};

// Export configuration for testing
export { AUTH_CONFIG, verifyToken };
