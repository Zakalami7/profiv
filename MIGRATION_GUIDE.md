# Supabase to SQLite Migration Guide

## Overview

This guide documents the complete migration from Supabase (PostgreSQL) to SQLite for the ProfiV educational platform.

## Migration Phases

### ✅ Phase 1: Database Layer (COMPLETED)
- **Files Created:**
  - `database/sqlite-schema.sql` - SQLite schema with 7 tables
  - `database/connection.ts` - Connection pooling with WAL mode
  - `database/migrate-to-sqlite.ts` - Migration script from Supabase
  - `database/query-builder.ts` - Chainable query interface

- **Tables Migrated:**
  1. `profiles` - User profiles and subscription data
  2. `system_config` - System configuration and curriculum
  3. `exercise_cache` - AI-generated exercise cache
  4. `user_histories` - User exercise history
  5. `assignments` - Teacher assignments
  6. `quiz_submissions` - Student quiz submissions
  7. `auth_users` - Authentication data

### ✅ Phase 2: Authentication System (COMPLETED)
- **Files Created:**
  - `auth/auth-system.ts` - Complete JWT authentication

- **Features:**
  - User registration with bcrypt password hashing
  - JWT token generation and validation
  - Session management
  - Profile creation on signup

### ✅ Phase 3: Service Refactoring (COMPLETED)
- **Files Updated:**
  - `services/historyService.ts` - User history management
  - `services/assignmentService.ts` - Assignment creation/retrieval
  - `services/curriculumService.ts` - Curriculum loading
  - `services/geminiService.ts` - Exercise cache integration
  - `services/paymentService.ts` - Profile updates

- **New File:**
  - `database/query-builder.ts` - Supabase-compatible query builder

### 🔄 Phase 4: Testing (IN PROGRESS)
- **Files Created:**
  - `tests/database.test.ts` - Comprehensive test suite

### ⏳ Phase 5: Documentation (PENDING)
- Migration guide (this file)
- API documentation updates
- Deployment guide

## Quick Start

### 1. Install Dependencies

```bash
npm install better-sqlite3 bcrypt jsonwebtoken uuid
npm install -D @types/better-sqlite3 @types/bcrypt @types/jsonwebtoken @types/uuid
```

### 2. Initialize Database

```bash
npx ts-node database/migrate-to-sqlite.ts
```

### 3. Run Tests

```bash
npm test
```

## API Changes

### Before (Supabase)
```typescript
import { supabase } from './supabaseClient';

const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

### After (SQLite)
```typescript
import { from } from './database/query-builder';

const { data, error } = await from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

## Authentication Changes

### Before (Supabase Auth)
```typescript
import { supabase } from './supabaseClient';

const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { full_name: name } }
});
```

### After (JWT Auth)
```typescript
import { signUp } from './auth/auth-system';

const { data, error } = await signUp(email, password, {
  preferred_cycle: 'COLLEGE',
  school_name: 'Test School'
});
```

## Configuration

### Environment Variables

```env
# Database
SQLITE_DB_PATH=./data/profiV.sqlite

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Optional: Supabase migration source
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## Data Migration

To migrate existing data from Supabase:

```bash
# Set environment variables
export SUPABASE_URL=your-supabase-url
export SUPABASE_ANON_KEY=your-anon-key

# Run migration
npx ts-node database/migrate-to-sqlite.ts
```

The migration script will:
1. Connect to Supabase
2. Extract all data from tables
3. Convert to SQLite format
4. Insert into local database
5. Verify data integrity

## Rollback Procedure

If you need to rollback to Supabase:

1. Restore from backup (if available)
2. Update `services/supabaseClient.ts` with your credentials
3. Switch service imports back to supabaseClient
4. Redeploy application

## Performance Considerations

### SQLite Optimizations Applied:
- **WAL Mode**: Better concurrent read/write performance
- **Connection Pooling**: Reuses database connections
- **Indexes**: 12 indexes created for frequently queried columns
- **Prepared Statements**: Prevents SQL injection and improves performance

### Limitations:
- Single-file database (good for small-medium apps)
- Limited concurrent writes (mitigated by WAL mode)
- No built-in replication (use backup strategy)

## Security

### Implemented:
- ✅ Bcrypt password hashing (12 salt rounds)
- ✅ JWT token authentication
- ✅ Parameterized queries (SQL injection prevention)
- ✅ Input validation on all endpoints

### Recommendations:
- Use HTTPS in production
- Store JWT secret securely (environment variable)
- Regular database backups
- Monitor authentication attempts

## Troubleshooting

### Common Issues:

**Database locked error:**
- Check if another process is using the database
- WAL mode should prevent most locking issues

**Migration fails:**
- Verify Supabase credentials
- Check network connectivity
- Review error logs in `migration-report.json`

**Authentication errors:**
- Verify JWT_SECRET is set and >= 32 characters
- Check token expiration settings

## Support

For issues or questions:
1. Check the test suite: `npm test`
2. Review migration logs: `migration-report.json`
3. Consult the schema: `database/sqlite-schema.sql`

## Migration Status Summary

| Component | Status | Files |
|-----------|--------|-------|
| Database Schema | ✅ Complete | sqlite-schema.sql |
| Connection Layer | ✅ Complete | connection.ts |
| Query Builder | ✅ Complete | query-builder.ts |
| Auth System | ✅ Complete | auth-system.ts |
| History Service | ✅ Complete | historyService.ts |
| Assignment Service | ✅ Complete | assignmentService.ts |
| Curriculum Service | ✅ Complete | curriculumService.ts |
| Gemini Service | ✅ Complete | geminiService.ts |
| Payment Service | ✅ Complete | paymentService.ts |
| Test Suite | 🔄 In Progress | database.test.ts |
| Documentation | 🔄 In Progress | MIGRATION_GUIDE.md |

---

**Last Updated:** 2024
**Migration Version:** 1.0.0
