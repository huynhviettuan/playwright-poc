# CI Templates

This folder contains sample CI configurations for future use.

## Files

-   `github.yml` - GitHub Actions template
-   `gitlab.yml` - GitLab CI template

## GitHub Actions

To enable GitHub Actions:

1. Create folder:

```bash
mkdir -p .github/workflows
```

2. Copy template:

```bash
cp docs/ci/github.yml .github/workflows/playwright.yml
```

3. Add repository secrets:

-   `REPORT_API_KEY`
-   `REPORT_ENDPOINT`
-   `API_DOMAIN`
-   `PASSWORD`
-   `SUPER_ADMIN_EMAIL`
-   `MAIL_DOMAIN`
-   `BASE_URL`

## GitLab CI

To enable GitLab CI:

```bash
cp docs/ci/gitlab.yml .gitlab-ci.yml
```

Then add CI/CD variables in GitLab project settings:

-   `REPORT_API_KEY`
-   `REPORT_ENDPOINT`
-   `API_DOMAIN`
-   `PASSWORD`
-   `SUPER_ADMIN_EMAIL`
-   `MAIL_DOMAIN`
-   `BASE_URL`

## Pipeline Stages

### Quality

Runs:

```bash
npm run check
npm run lint
```

### API Tests

Runs:

```bash
npm run test:api
```

### E2E Tests

Runs:

```bash
npm run test:e2e
```

## Artifacts

Both templates upload:

-   `playwright-report/`
-   `test-results/`

## Notes

-   Templates are stored under `docs/ci/` so they do not automatically enable CI.
-   Copy the template to the platform-specific location only when ready.
-   Keep secrets in CI variables/secrets, never commit `.env` files.
