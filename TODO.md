# Fix database.test.ts Errors - Task List

## Steps to Complete:

- [x] 1. Analyze test file and identify all errors
- [x] 2. Read related source files to understand correct function signatures
- [x] 3. Create comprehensive fix plan

### Fixes to Apply:

- [x] 4. Fix import paths - Add `.js` extensions for ES module compatibility
  - `from '../database/query-builder'` → `from '../database/query-builder.js'`
  - `from '../database/connection'` → `from '../database/connection.js'`
  - `from '../auth/auth-system'` → `from '../auth/auth-system.js'`

- [x] 5. Fix `signUp` calls - Change from positional args to object syntax
  - `signUp(email, password, { ... })` → `signUp({ email, password, preferred_cycle, school_name })`

- [x] 6. Fix `signIn` calls - Change from positional args to object syntax
  - `signIn(email, password)` → `signIn({ email, password })`

- [x] 7. Fix `getUser` calls - Use token from session instead of user ID
  - `getUser(createdUser.id)` → `getUser(authData.session.access_token)`

- [x] 8. Update test assertions to match actual return types
  - Changed destructuring from `data` to `{ user, session, error }` to match `AuthResponse` type
  - Updated all test assertions to use correct property names

- [x] 9. Verify all fixes compile correctly
  - All TypeScript errors resolved
  - File compiles successfully
