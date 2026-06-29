# Skill: Set Up CI Pipeline

## When to Use

Use this skill when setting up or modifying CI/CD pipelines for running Playwright tests automatically.

## When NOT to Use

| Situation                             | Use instead                  |
| ------------------------------------- | ---------------------------- |
| Configuring test result notifications | `configure-notifications.md` |
| Debugging CI failures                 | `debug-tests.md`             |
| Managing environment configs          | `manage-environments.md`     |

## Supported Platforms

| Platform       | Template location    | Target location                    |
| -------------- | -------------------- | ---------------------------------- |
| GitHub Actions | `docs/ci/github.yml` | `.github/workflows/playwright.yml` |
| GitLab CI      | `docs/ci/gitlab.yml` | `.gitlab-ci.yml`                   |

## Pipeline Architecture

```
┌─────────┐     ┌────────────┐     ┌────────────┐
│ Quality │────→│ API Tests  │     │ E2E Tests  │
│ (lint)  │     │ (parallel) │     │ (parallel) │
└─────────┘     └────────────┘     └────────────┘
     │                │                   │
     └────────────────┴───────────────────┘
                      │
               ┌──────┴──────┐
               │  Artifacts  │
               │  (reports)  │
               └─────────────┘
```

**Stages:**

1. **Quality** — format check (`npm run check`) + lint (`npm run lint`)
2. **API Tests** — runs after quality passes, no browser needed
3. **E2E Tests** — runs after quality passes, installs Playwright browsers

API and E2E run in parallel after quality passes.

## Instructions

### 1. GitHub Actions Setup

#### Copy template

```bash
mkdir -p .github/workflows
cp docs/ci/github.yml .github/workflows/playwright.yml
```

#### Add repository secrets

Go to **Settings → Secrets and variables → Actions → New repository secret**:

| Secret              | Description                   | Example                           |
| ------------------- | ----------------------------- | --------------------------------- |
| `BASE_URL`          | App URL for E2E tests         | `https://staging.example.com`     |
| `API_DOMAIN`        | API base URL                  | `https://api.staging.example.com` |
| `SUPER_ADMIN_EMAIL` | Test account email            | `admin@test.com`                  |
| `PASSWORD`          | Test account password         | `Secret@123`                      |
| `MAIL_DOMAIN`       | Email domain for verification | `example.com`                     |
| `REPORT_API_KEY`    | Report Portal API key         | `uuid-key`                        |
| `REPORT_ENDPOINT`   | Report Portal URL             | `https://reportportal.io`         |

#### Add database secrets (if using `db` fixture)

| Secret        | Description        | Example          |
| ------------- | ------------------ | ---------------- |
| `DB_HOST`     | Database host      | `db.example.com` |
| `DB_PORT`     | Database port      | `5432`           |
| `DB_NAME`     | Database name      | `myapp_staging`  |
| `DB_USER`     | Database user      | `postgres`       |
| `DB_PASSWORD` | Database password  | `secret`         |
| `DB_SSL`      | Use SSL connection | `true`           |

#### Add environment variables to workflow

Add to the `env:` block in both `api-tests` and `e2e-tests` jobs:

```yaml
env:
    TEST_ENV: staging
    DB_HOST: ${{ secrets.DB_HOST }}
    DB_PORT: ${{ secrets.DB_PORT }}
    DB_NAME: ${{ secrets.DB_NAME }}
    DB_USER: ${{ secrets.DB_USER }}
    DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
    DB_SSL: ${{ secrets.DB_SSL }}
```

#### Verify

Push to a branch and check the **Actions** tab for pipeline status.

---

### 2. GitLab CI Setup

#### Copy template

```bash
cp docs/ci/gitlab.yml .gitlab-ci.yml
```

#### Add CI/CD variables

Go to **Settings → CI/CD → Variables → Add variable**:

Same variables as GitHub (see table above). Set **Protected** for production secrets.

#### Add environment variables

Add to the `variables:` block:

```yaml
variables:
    NODE_VERSION: '20'
    TEST_ENV: staging
    REPORT_LAUNCH: '$CI_PIPELINE_ID-$CI_JOB_NAME'
```

#### Update Playwright Docker image version

The template uses a specific Playwright version. Update to match your `package.json`:

```yaml
.default_node_job:
    image: mcr.microsoft.com/playwright:v1.61.0-jammy
```

Check the version: `npx playwright --version` and update accordingly.

#### Verify

Push to a branch and check **CI/CD → Pipelines** for status.

---

### 3. Multi-Environment CI

Run tests against different environments on different triggers:

#### GitHub Actions — environment matrix

```yaml
e2e-tests:
    runs-on: ubuntu-latest
    needs: quality
    strategy:
        matrix:
            environment: [dev, staging]
    environment: ${{ matrix.environment }}

    env:
        TEST_ENV: ${{ matrix.environment }}
        BASE_URL: ${{ secrets.BASE_URL }}
        # ... other secrets from the environment
```

Set up **Environments** in GitHub (**Settings → Environments**) with per-environment secrets.

#### GitLab CI — environment-specific jobs

```yaml
e2e-tests:dev:
    extends: .default_node_job
    stage: test
    variables:
        TEST_ENV: dev
    environment:
        name: dev
    rules:
        - if: $CI_COMMIT_BRANCH == "develop"

e2e-tests:staging:
    extends: .default_node_job
    stage: test
    variables:
        TEST_ENV: staging
    environment:
        name: staging
    rules:
        - if: $CI_COMMIT_BRANCH == "main"
```

---

### 4. Test Sharding (Parallel Execution)

Split E2E tests across multiple CI jobs for faster execution:

#### GitHub Actions

```yaml
e2e-tests:
    runs-on: ubuntu-latest
    needs: quality
    strategy:
        fail-fast: false
        matrix:
            shard: [1/4, 2/4, 3/4, 4/4]

    steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
              node-version: 20
              cache: npm
        - run: npm ci
        - run: npx playwright install --with-deps
        - run: npx playwright test --project=e2e --shard=${{ matrix.shard }}
        - uses: actions/upload-artifact@v4
          if: always()
          with:
              name: e2e-report-${{ strategy.job-index }}
              path: |
                  playwright-report/
                  test-results/
```

#### GitLab CI

```yaml
e2e-tests:
    extends: .default_node_job
    stage: test
    parallel: 4
    script:
        - npx playwright test --project=e2e --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
```

---

### 5. Scheduled Runs

Run tests on a schedule (e.g., nightly regression suite):

#### GitHub Actions

```yaml
on:
    schedule:
        - cron: '0 2 * * 1-5' # Weekdays at 2 AM UTC
    workflow_dispatch: # Manual trigger
```

#### GitLab CI

```yaml
rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
    - if: $CI_PIPELINE_SOURCE == "web"
```

Create the schedule in **CI/CD → Schedules**.

---

### 6. Report Artifacts

Both templates upload reports automatically. Access them:

#### GitHub Actions

-   Go to the workflow run → **Artifacts** section at the bottom
-   Download `e2e-playwright-report` or `api-playwright-report`

#### GitLab CI

-   Go to the pipeline → click the job → **Artifacts** section
-   Browse or download `playwright-report/` and `test-results/`

#### Viewing traces from CI failures

```bash
# Download the artifact, extract, then:
npx playwright show-trace test-results/<test-name>/trace.zip
```

---

### 7. Notifications on Failure

Combine with `configure-notifications.md` to send Slack/Teams/email on CI failures:

```yaml
# GitHub Actions — add after test step
- name: Notify on failure
  if: failure()
  run: |
      curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -d '{"text": "❌ Playwright tests failed on ${{ github.ref }}"}'
  env:
      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

Or use the built-in notification reporter (see `configure-notifications.md`).

## Checklist

### Initial setup

-   [ ] Template copied to correct location
-   [ ] All secrets/variables configured in CI platform
-   [ ] Playwright Docker image version matches project (GitLab)
-   [ ] Pipeline runs successfully on push

### Multi-environment

-   [ ] `TEST_ENV` set per job/environment
-   [ ] Per-environment secrets configured
-   [ ] Production tests skip destructive operations

### Performance

-   [ ] Sharding configured for large test suites
-   [ ] `npm ci` with cache enabled
-   [ ] Playwright browser install cached where possible

### Monitoring

-   [ ] Artifacts uploaded on failure (`if: always()`)
-   [ ] Trace enabled on first retry
-   [ ] Failure notifications configured (Slack/Teams/email)
-   [ ] Scheduled nightly runs set up for regression

## Troubleshooting CI

| Problem                          | Fix                                                       |
| -------------------------------- | --------------------------------------------------------- |
| `Browser not found`              | Add `npx playwright install --with-deps` step             |
| `Permission denied`              | Use `mcr.microsoft.com/playwright` Docker image (GitLab)  |
| Tests pass locally, fail in CI   | See `debug-tests.md` → "Passes locally, fails in CI"      |
| Secrets not available            | Check secret names match exactly, check branch protection |
| Pipeline too slow                | Add sharding, cache `node_modules`, parallelize jobs      |
| Docker image version mismatch    | Match image tag to `npx playwright --version`             |
| Report Portal not receiving data | Check `REPORT_API_KEY` and `REPORT_ENDPOINT` secrets      |
