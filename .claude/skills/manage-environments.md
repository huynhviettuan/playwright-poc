# Skill: Manage Environments

## When to Use

Use this skill when setting up, switching, or configuring environment-specific test execution (dev, staging,
production).

## When NOT to Use

| Situation                    | Use instead                 |
| ---------------------------- | --------------------------- |
| Adding a new config key      | Edit `config.constant.ts`   |
| Changing Playwright projects | Edit `playwright.config.ts` |
| Setting up CI pipelines      | `docs/ci/` templates        |

## How It Works

### Config Loading Order

```
1. Load .env.{TEST_ENV}    (environment-specific, overrides)
2. Load .env               (shared defaults, fills gaps)
```

`TEST_ENV` defaults to `dev` when not set. The environment-specific file takes priority — any variable defined in both
files uses the value from `.env.{TEST_ENV}`.

### File Structure

```
project-root/
├── .env                  # Shared defaults (gitignored)
├── .env.dev              # Dev environment (gitignored)
├── .env.staging          # Staging environment (gitignored)
├── .env.production       # Production environment (gitignored)
├── .env.example          # Template with all keys (committed)
```

### Config Access

```ts
import { Config } from '@constants/config.constant';

Config.env; // current environment name: 'dev' | 'staging' | 'production'
Config.app.baseUrl; // resolved from env files
Config.api.domain; // resolved from env files
Config.auth.password; // resolved from env files
```

## Instructions

### 1. Create a New Environment

Copy `.env.example` and fill in values:

```bash
cp .env.example .env.staging
```

Edit `.env.staging`:

```env
BASE_URL=https://staging.example.com
API_DOMAIN=https://api.staging.example.com
SUPER_ADMIN_EMAIL=admin@staging.example.com
PASSWORD=StagingPassword123!
MAIL_DOMAIN=staging.example.com
```

### 2. Run Tests Against an Environment

**Via npm scripts:**

```bash
npm run test:e2e:dev
npm run test:e2e:staging
npm run test:e2e:production
npm run test:api:dev
npm run test:api:staging
npm run test:api:production
```

**Via environment variable directly:**

```bash
# Windows (PowerShell)
$env:TEST_ENV="staging"; npx playwright test --project=e2e

# Linux / macOS
TEST_ENV=staging npx playwright test --project=e2e

# Cross-platform
npx cross-env TEST_ENV=staging npx playwright test --project=e2e
```

### 3. Use Environment in Tests

Skip tests that shouldn't run in certain environments:

```ts
import { Config } from '@constants/config.constant';
import { expect, test } from '@fixtures/fixtures';

test.describe('Admin Features', () => {
    test.skip(() => Config.env === 'production', 'Skip destructive tests in production');

    test('should delete user', async ({ adminPage }) => {
        // only runs in dev and staging
    });
});
```

Conditional test data per environment:

```ts
const testEmail = Config.env === 'production' ? 'readonly-user@example.com' : DataGenerator.randomEmail('test');
```

### 4. Add a New Config Key

1. Add the key to `.env.example` with an empty value
2. Add it to all `.env.*` files with environment-specific values
3. Add it to the `Config` object in `src/constants/config.constant.ts`:

```ts
export const Config = {
    env,
    // ... existing keys ...
    newSection: {
        newKey: getEnv('NEW_KEY')
    }
} as const;
```

### 5. CI Configuration

In CI, set `TEST_ENV` as a pipeline variable:

```yaml
# GitHub Actions
env:
    TEST_ENV: staging

# GitLab CI
variables:
    TEST_ENV: staging
```

Or use the npm scripts directly:

```yaml
- run: npm run test:e2e:staging
```

## Shared vs Environment-Specific Values

| Value type               | Where to put it   | Example                    |
| ------------------------ | ----------------- | -------------------------- |
| Changes per environment  | `.env.{env}` only | `BASE_URL`, `API_DOMAIN`   |
| Same across all envs     | `.env` only       | `REPORT_ENDPOINT`          |
| Sensitive credentials    | `.env.{env}` only | `PASSWORD`, `API_KEY`      |
| Template / documentation | `.env.example`    | All keys with empty values |

## Checklist

-   [ ] `.env.example` has all keys (committed to repo)
-   [ ] `.env.*` files are in `.gitignore`
-   [ ] New config keys added to `Config` object in `config.constant.ts`
-   [ ] npm scripts added for new environment if needed
-   [ ] CI pipeline sets `TEST_ENV` variable
-   [ ] Production-only skips added for destructive tests
