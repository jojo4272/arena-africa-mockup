# Contributing to Arena Africa

Thank you for considering contributing to Arena Africa! This guide will help you get started.

## Code of Conduct

Be respectful, inclusive, and constructive. We're building for Africa, and our community should reflect that diversity.

## Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Git
- Code editor (VS Code recommended)

### Initial Setup

1. **Fork & Clone**
   ```bash
   git clone https://github.com/your-username/arena-africa.git
   cd arena-africa
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and set DATABASE_URL to your local PostgreSQL
   ```

4. **Setup Database**
   ```bash
   # Create database
   createdb arena_dev
   
   # Apply schema and indexes
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   # App runs at http://localhost:3000
   ```

6. **Verify Setup**
   - Open http://localhost:3000
   - Click "Select Profile" to enter dashboard
   - Place a test prediction
   - If everything works, you're ready!

## Project Structure

```
arena-africa/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── actions.ts    # Server Actions (auth via cookie)
│   │   ├── api/          # REST API routes (auth via Bearer token)
│   │   ├── dashboard/    # Web dashboard
│   │   ├── mobile/       # Mobile PWA screens
│   │   └── page.tsx      # Marketing landing page
│   ├── components/       # React components
│   ├── db/
│   │   ├── schema.ts     # Drizzle ORM schema
│   │   ├── indexes.sql   # Indexes & CHECK constraints
│   │   └── seed.ts       # Auto-seeding logic
│   ├── lib/
│   │   ├── auth.ts       # Token generation/verification
│   │   ├── policy.ts     # Policy engine (RBAC + KYC)
│   │   ├── rbac.ts       # Role-based access control
│   │   ├── validators.ts # Shared business logic validators
│   │   ├── rates.ts      # Currency exchange rates
│   │   ├── security.ts   # Security headers
│   │   └── transactions.ts # DB transaction wrapper
│   └── proxy.ts          # Next.js request interceptor (rate limiting)
├── tests/                # Vitest unit & integration tests
├── docs/                 # Documentation
└── public/               # Static assets
```

## Architecture Principles

### Two Auth Paths
- **Server Actions** (`src/app/actions.ts`): Authenticated via `arena_token` HTTP-only cookie
- **API Routes** (`src/app/api/**/route.ts`): Accept Bearer token OR cookie

Both paths validate the same HMAC-SHA256 tokens from `src/lib/auth.ts`.

### Policy Enforcement
All mutations MUST go through the policy engine (`src/lib/policy.ts`) either:
1. Directly via `evaluatePolicy()` in API routes
2. Via shared validators (`src/lib/validators.ts`) in Server Actions

**Never bypass policy checks.** If you add a new mutation, add a validator.

### Currency Handling
- **Single source of truth**: `src/lib/rates.ts`
- Store exchange rate snapshot on transactions (`exchangeRate` field - to be added)
- Use `toUsd()` for policy limit calculations
- Use `formatCurrency()` for display

### Database Transactions
Use `withTransaction()` wrapper for multi-step operations:
```typescript
import { withTransaction } from "@/lib/transactions";

const result = await withTransaction(async () => {
  // Multiple DB operations here
  // Automatically rolled back on error
});
```

## Development Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring
- `test/description` - Test additions

### Commit Messages
Follow conventional commits:
```
feat: add chama payout distribution
fix: policy engine not enforcing USSD limits
docs: update deployment guide with Docker compose
refactor: centralize currency exchange rates
test: add policy engine test suite
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Changes**
   - Write code
   - Add tests
   - Update documentation

3. **Test Locally**
   ```bash
   npm run typecheck   # TypeScript validation
   npm run lint        # ESLint
   npm test            # Unit tests
   npm run build       # Production build
   ```

4. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: description of changes"
   git push origin feature/my-feature
   ```

5. **Open Pull Request**
   - Title: Clear, concise description
   - Description: What changed, why, how to test
   - Link related issues
   - Add screenshots for UI changes

6. **Code Review**
   - Address feedback
   - Keep commits atomic
   - Squash when merging

## Testing Guidelines

### Unit Tests
Test business logic in isolation:
```typescript
// tests/policy.test.ts
import { describe, it, expect } from 'vitest';
import { evaluatePolicy } from '@/lib/policy';

describe('Policy Engine', () => {
  it('should deny US users', () => {
    const decision = evaluatePolicy({
      action: 'predict:create',
      subject: { role: 'MEMBER', countryCode: 'US' },
    });
    expect(decision.effect).toBe('DENY');
  });
});
```

### Integration Tests
Test multiple components together:
```typescript
// tests/prediction-flow.test.ts
it('should place prediction and update balance', async () => {
  const validation = await validatePrediction({
    userId: 1,
    marketId: 1,
    amount: 500,
    channel: 'WEB',
  });
  expect(validation.allowed).toBe(true);
});
```

### E2E Tests (Future)
Using Playwright to test full user flows.

### Test Coverage
Aim for:
- 80%+ coverage on core business logic (`lib/policy.ts`, `lib/validators.ts`)
- 60%+ overall coverage
- 100% coverage on security-critical code (`lib/auth.ts`)

Run coverage:
```bash
npm run test:coverage
```

## Code Style

### TypeScript
- Use strict mode
- Prefer explicit types over `any`
- Use interfaces for objects, types for unions
- Document complex types with JSDoc

### React
- Functional components only
- Use hooks (`useState`, `useEffect`, etc.)
- Extract reusable logic to custom hooks
- Keep components focused (single responsibility)

### Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **Functions**: camelCase (`getUserById`)
- **Constants**: UPPER_SNAKE_CASE (`KYC_LIMITS`)
- **Files**: kebab-case for non-components (`rate-limit.ts`)

### Formatting
We use ESLint + Prettier defaults:
```bash
npm run lint        # Check
npm run lint:fix    # Auto-fix
```

## Common Tasks

### Adding a New API Endpoint

1. **Create route file**
   ```typescript
   // src/app/api/my-endpoint/route.ts
   import { requireUser } from "@/lib/guard";
   
   export async function GET(request: Request) {
     const user = await requireUser(request);
     // Your logic here
     return Response.json({ success: true, data: {} });
   }
   ```

2. **Add policy enforcement**
   ```typescript
   import { evaluatePolicy } from "@/lib/policy";
   
   const decision = evaluatePolicy({
     action: 'my:action',
     subject: { userId: user.id, role: user.role, ... },
   });
   
   if (!decision.allowed) {
     return Response.json({ success: false, error: decision.reasons[0] }, { status: 403 });
   }
   ```

3. **Write tests**
   ```typescript
   // tests/my-endpoint.test.ts
   describe('My Endpoint', () => {
     it('should return data', async () => {
       // Test implementation
     });
   });
   ```

4. **Document in API.md**
   Add endpoint documentation to `docs/API.md`.

### Adding a New Policy Rule

1. **Define rule in `src/lib/policy.ts`**
   ```typescript
   {
     id: "my.rule",
     description: "Describes what this rule does",
     evaluate: (ctx) => {
       if (condition) {
         return {
           effect: "DENY",
           code: "MY_RULE_VIOLATION",
           reason: "Human-readable explanation",
         };
       }
       return null; // Rule passes
     },
   }
   ```

2. **Add tests**
   ```typescript
   // tests/policy.test.ts
   it('should enforce my rule', () => {
     const decision = evaluatePolicy({ /* context */ });
     expect(decision.codes).toContain('MY_RULE_VIOLATION');
   });
   ```

3. **Update documentation**
   Document the new rule and its codes in `docs/API.md`.

### Adding a New Currency

1. **Add to `src/lib/rates.ts`**
   ```typescript
   XYZ: { 
     code: 'XYZ', 
     name: 'Currency Name', 
     symbol: 'X', 
     toUsd: 0.0123, 
     region: 'west-africa' 
   }
   ```

2. **Update schema if needed**
   If adding a new default currency, update `src/db/schema.ts`.

3. **Test conversion**
   ```typescript
   // tests/rates.test.ts
   it('should convert XYZ to USD', () => {
     expect(toUsd(1000, 'XYZ')).toBeCloseTo(12.3, 1);
   });
   ```

## Database Migrations

We use Drizzle ORM. Schema changes require:

1. **Update `src/db/schema.ts`**
   ```typescript
   export const myTable = pgTable("my_table", {
     id: serial("id").primaryKey(),
     name: text("name").notNull(),
   });
   ```

2. **Update `src/db/indexes.sql` if adding indexes**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_my_table_name ON my_table (name);
   ```

3. **Apply changes**
   ```bash
   npm run db:push
   ```

4. **Commit both files**
   Always commit `schema.ts` and `indexes.sql` together.

## Debugging

### Server-Side
```typescript
import { logger, LogLevel } from "@/lib/logger";

logger.log(LogLevel.INFO, "Debug message", {
  userId: 1,
  metadata: { key: "value" },
});
```

### Client-Side
```typescript
console.log('[Arena] Debug:', data);
```

### Database Queries
```bash
# Enable query logging
psql $DATABASE_URL
SET log_statement = 'all';
# Run your query
```

## Performance Guidelines

- Use database indexes for all foreign keys and frequently queried fields
- Paginate large result sets (default limit: 50, max: 100)
- Use `React.memo()` for expensive components
- Lazy-load heavy components (`next/dynamic`)
- Optimize images with `next/image`

## Security Checklist

Before submitting a PR:
- [ ] No hardcoded secrets (use environment variables)
- [ ] SQL injection safe (Drizzle parameterizes automatically)
- [ ] XSS safe (React escapes by default)
- [ ] CSRF safe (use cookies with `SameSite`)
- [ ] Policy engine enforced for all mutations
- [ ] Rate limiting tested (API routes only)
- [ ] Input validation added for user input
- [ ] Error messages don't leak sensitive info

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue (use bug template)
- **Features**: Open a GitHub Issue (use feature template)
- **Security**: Email security@arena.africa (see SECURITY.md)
- **Real-time**: Join our Discord (link TBD)

## Recognition

Contributors are recognized in:
- GitHub contributors page
- CHANGELOG.md for each release
- Annual contributor spotlight (blog post)

Significant contributions may earn:
- Core contributor status
- Beta access to new features
- Invitation to contributor calls

## License

By contributing, you agree that your contributions will be licensed under the MIT License (same as the project).

---

Thank you for making Arena Africa better! 🎯🌍
