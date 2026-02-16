/**
 * Database Tests - Comprehensive test suite for SQLite migration
 * Tests all database operations, adapters, and query builder
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { from } from '../database/query-builder.js';
import { initializeDatabase, closeDatabase } from '../database/connection.js';
import { signUp, signIn, getUser } from '../auth/auth-system.js';

describe('Database Layer Tests', () => {
    beforeAll(async () => {
        await initializeDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('Connection', () => {
        it('should initialize database successfully', async () => {
            const result = await initializeDatabase();
            expect(result).toBe(true);
        });

        it('should have all 7 tables created', async () => {
            const tables = ['profiles', 'system_config', 'exercise_cache', 'user_histories', 'assignments', 'quiz_submissions', 'auth_users'];
            
            for (const table of tables) {
                const { data, error } = await from(table).select('id').limit(1).execute();
                expect(error).toBeNull();
            }
        });
    });

    describe('Query Builder - SELECT operations', () => {
        it('should select data with eq filter', async () => {
            const { data, error } = await from('system_config')
                .select('*')
                .eq('id', 1)
                .single();
            
            expect(error).toBeNull();
            expect(data).toBeDefined();
        });

        it('should select with multiple filters', async () => {
            const { data, error } = await from('profiles')
                .select('*')
                .eq('plan', 'FREE')
                .gt('daily_credits', 0)
                .execute();
            
            expect(error).toBeNull();
            expect(Array.isArray(data)).toBe(true);
        });

        it('should order results', async () => {
            const { data, error } = await from('profiles')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10)
                .execute();
            
            expect(error).toBeNull();
            expect(Array.isArray(data)).toBe(true);
        });
    });

    describe('Query Builder - INSERT operations', () => {
        it('should insert data into exercise_cache', async () => {
            const testData = {
                signature: 'test-signature-' + Date.now(),
                content: { test: 'data', exercises: [] }
            };

            const { data, error } = await from('exercise_cache').insert(testData);
            
            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(data?.signature).toBe(testData.signature);
        });

        it('should insert data into assignments', async () => {
            const testData = {
                code: 'TST-' + Math.floor(100 + Math.random() * 900),
                content: [{ title: 'Test', enonce: 'Test', corrige: 'Test' }],
                options: { level: 'Test', subject: 'Test' }
            };

            const { data, error } = await from('assignments').insert(testData);
            
            expect(error).toBeNull();
            expect(data).toBeDefined();
        });
    });

    describe('Query Builder - UPDATE operations', () => {
        it('should update data with filters', async () => {
            // First insert a test profile
            const { user, error: signUpError } = await signUp({ 
                email: 'test-update@example.com', 
                password: 'password123', 
                preferred_cycle: 'COLLEGE',
                school_name: 'Test School'
            });

            expect(signUpError).toBeNull();
            
            if (user) {
                const { data, error } = await from('profiles')
                    .eq('id', user.id)
                    .update({ daily_credits: 999 });

                expect(error).toBeNull();
                expect(data).toBeDefined();
            }
        });
    });

    describe('Query Builder - DELETE operations', () => {
        it('should delete data with filters', async () => {
            const { data, error } = await from('exercise_cache')
                .eq('signature', 'test-signature-delete')
                .delete();

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(typeof data?.count).toBe('number');
        });
    });
});

describe('Authentication System Tests', () => {
    beforeAll(async () => {
        await initializeDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('User Registration', () => {
        it('should sign up a new user', async () => {
            const email = `test-${Date.now()}@example.com`;
            const password = 'SecurePass123!';
            
            const { user, error } = await signUp({ 
                email, 
                password, 
                preferred_cycle: 'LYCEE',
                school_name: 'Test High School'
            });

            expect(error).toBeNull();
            expect(user).toBeDefined();
            expect(user?.email).toBe(email);
        });

        it('should not allow duplicate emails', async () => {
            const email = `duplicate-${Date.now()}@example.com`;
            const password = 'SecurePass123!';

            // First signup
            const firstResult = await signUp({ email, password });
            expect(firstResult.error).toBeNull();

            // Second signup with same email should fail
            const { user, error } = await signUp({ email, password });
            
            expect(error).toBeDefined();
            expect(user).toBeNull();
        });
    });

    describe('User Login', () => {
        it('should sign in with valid credentials', async () => {
            const email = `login-test-${Date.now()}@example.com`;
            const password = 'SecurePass123!';

            // Create user first
            const signUpResult = await signUp({ email, password });
            expect(signUpResult.error).toBeNull();

            // Try to login
            const { user, session, error } = await signIn({ email, password });
            
            expect(error).toBeNull();
            expect(user).toBeDefined();
            expect(session).toBeDefined();
        });

        it('should reject invalid credentials', async () => {
            const { user, error } = await signIn({ 
                email: 'nonexistent@example.com', 
                password: 'wrongpassword' 
            });
            
            expect(error).toBeDefined();
            expect(user).toBeNull();
        });
    });

    describe('User Management', () => {
        it('should get user by token', async () => {
            const email = `get-user-${Date.now()}@example.com`;
            const password = 'SecurePass123!';

            const { user, session, error: signUpError } = await signUp({ email, password });
            expect(signUpError).toBeNull();
            
            if (session?.access_token) {
                const { user: fetchedUser, error } = await getUser(session.access_token);
                
                expect(error).toBeNull();
                expect(fetchedUser).toBeDefined();
                expect(fetchedUser?.id).toBe(user?.id);
            }
        });
    });
});

describe('Service Integration Tests', () => {
    beforeAll(async () => {
        await initializeDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('History Service', () => {
        it('should add and retrieve history items', async () => {
            const { addToHistory, getUserHistory } = await import('../services/historyService.js');
            
            const userId = 'test-user-' + Date.now();
            const historyItem = {
                id: 'hist-' + Date.now(),
                timestamp: Date.now(),
                dateStr: new Date().toISOString(),
                options: {
                    level: 'Test',
                    subject: 'Math',
                    chapter: 'Algebra',
                    selectedChapters: [],
                    difficulty: 'Medium',
                    type: 'Exercise',
                    objective: 'Practice',
                    includeIllustration: false,
                    useAI: true,
                    professorName: 'Test',
                    schoolName: 'Test School',
                    includeOfficialHeader: false,
                    exerciseCount: 5
                },
                exercises: []
            };

            await addToHistory(userId, historyItem);
            
            const history = await getUserHistory(userId);
            expect(Array.isArray(history)).toBe(true);
        });
    });

    describe('Assignment Service', () => {
        it('should create and retrieve assignments', async () => {
            const { createAssignment, getAssignmentByCode } = await import('../services/assignmentService.js');
            
            const exercises = [{ title: 'Test', enonce: 'Test', corrige: 'Test' }];
            const options = {
                level: 'Test',
                subject: 'PHY',
                chapter: 'Test',
                selectedChapters: [],
                difficulty: 'Medium',
                type: 'Exercise',
                objective: 'Practice',
                includeIllustration: false,
                useAI: false,
                professorName: 'Test',
                schoolName: 'Test',
                includeOfficialHeader: false,
                exerciseCount: 1
            };

            const code = await createAssignment(exercises, options, 'test-user');
            expect(code).toBeDefined();
            expect(code).toMatch(/^PHY-\d{3}$/);

            if (code) {
                const assignment = await getAssignmentByCode(code);
                expect(assignment).toBeDefined();
            }
        });
    });

    describe('Curriculum Service', () => {
        it('should retrieve curriculum', async () => {
            const { getCurriculum } = await import('../services/curriculumService.js');
            
            const curriculum = await getCurriculum();
            expect(curriculum).toBeDefined();
            expect(typeof curriculum).toBe('object');
        });
    });
});
