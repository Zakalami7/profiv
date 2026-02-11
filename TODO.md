# Supabase → SQLite Migration TODO

## Phase 1: Database Layer ✅ COMPLETED

### 1.1 SQLite Schema
- [x] Create `database/sqlite-schema.sql` with all 7 tables
- [x] Convert PostgreSQL types to SQLite equivalents
- [x] Add indexes for performance

### 1.2 Database Adapter
- [x] Create `database/database-adapter.ts` - Unified interface
- [x] Implement query builder methods
- [x] Add error handling and logging

### 1.3 Connection Management
- [x] Create `database/connection.ts` - SQLite connection pool
- [x] Enable WAL mode
- [x] Configure PRAGMA settings

### 1.4 Migration Script
- [x] Create `database/migrate-to-sqlite.ts` - Schema initialization
- [x] Add verification functions
- [x] Migration tested and working ✅


## Phase 2: Authentication System ⏳ PENDING

### 2.1 JWT Auth
- [ ] Create `auth/auth-system.ts`
- [ ] Implement bcrypt password hashing
- [ ] Token generation/validation

### 2.2 Middleware
- [ ] Create `auth/middleware.ts`
- [ ] Replace Supabase RLS logic

## Phase 3: Service Refactoring ⏳ PENDING

### 3.1 History Service
- [ ] Update `services/historyService.ts` to use adapter

### 3.2 Payment Service
- [ ] Update `services/paymentService.ts` - Replace profile updates

### 3.3 Gemini Service
- [ ] Update `services/geminiService.ts` - Replace cache operations

### 3.4 Assignment Service
- [ ] Update `services/assignmentService.ts` - Replace all DB calls

### 3.5 Curriculum Service
- [ ] Update `services/curriculumService.ts` - Replace config fetching

## Phase 4: Testing ⏳ PENDING

- [ ] Create `tests/database.test.ts`
- [ ] Create `tests/auth.test.ts`
- [ ] 95%+ coverage target

## Phase 5: Documentation ⏳ PENDING

- [ ] Create `MIGRATION_GUIDE.md`
- [ ] Update environment variables
- [ ] Remove Supabase dependencies

## Completion Checklist
- [ ] All 6 tables created in SQLite
- [ ] All services refactored
- [ ] Tests passing
- [ ] No Supabase dependencies remaining
- [ ] Documentation complete
