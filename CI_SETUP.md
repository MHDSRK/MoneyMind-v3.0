# CI/CD Configuration

This project uses GitHub Actions to automatically verify code quality before merges.

## GitHub Actions Workflow

The CI workflow (`.github/workflows/ci.yml`) runs on every:
- Push to `main`, `master`, or `develop`
- Pull request targeting these branches

### Jobs

#### 1. **TypeScript Type Check**
- Verifies all TypeScript code compiles without type errors
- Command: `pnpm typecheck`
- Blocks merge if errors found ❌

#### 2. **Production Build**
- Builds the project for production deployment
- Command: `pnpm build`
- Verifies build succeeds and generates dist/ output
- Blocks merge if build fails ❌
- Uploads build artifacts for 1 day

#### 3. **Tests**
- Runs full test suite (51 tests across 2 files)
- Command: `pnpm test -- --run`
- Generates coverage report (continues even if coverage fails)
- Blocks merge if tests fail ❌

#### 4. **Linting** (Placeholder)
- Ready to enable when ESLint is configured
- Uncomment the `lint:` job in `.github/workflows/ci.yml`
- Command: `pnpm lint`

## Local Development Setup (Optional)

### Using Pre-commit Hooks

To catch issues locally before pushing to GitHub:

#### Option A: Using Husky (Recommended)

1. Install Husky and lint-staged:
```bash
pnpm add -D husky lint-staged
npx husky install
```

2. Add to `package.json`:
```json
{
  "lint-staged": {
    "*.ts?(x)": ["pnpm typecheck", "pnpm test -- --run"]
  }
}
```

3. Create pre-commit hook:
```bash
npx husky add .husky/pre-commit "npx lint-staged"
```

#### Option B: Manual Pre-commit Check

Run this before pushing:
```bash
pnpm typecheck && pnpm test -- --run && pnpm build
```

## Branch Protection Rules

To enforce CI checks, configure GitHub branch protection on `main`:

1. Go to: **Settings** → **Branches** → **Add rule**
2. Apply to branch: `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Select all required checks:
     - `TypeScript Type Check`
     - `Production Build`
     - `Tests`
   - ✅ Dismiss stale PR approvals
   - ✅ Require branches to be up to date before merging

## Test Coverage

Coverage reports are generated and can be accessed from CI artifacts:
- Local: `pnpm test:coverage` generates HTML report in `coverage/`
- CI: Reports are available in workflow artifacts

## Adding ESLint

When ready to add code style linting:

1. Install ESLint:
```bash
pnpm add -D eslint @eslint/js typescript-eslint
```

2. Create `eslint.config.js`

3. Add lint script to `package.json`:
```json
{
  "scripts": {
    "lint": "eslint src/ --ext .ts,.tsx"
  }
}
```

4. Uncomment the `lint:` job in `.github/workflows/ci.yml`

5. (Optional) Add to lint-staged config:
```json
{
  "lint-staged": {
    "*.ts?(x)": ["eslint --fix"]
  }
}
```

## Debugging CI Failures

If a workflow fails:

1. Check the **Actions** tab in GitHub
2. Click the failed workflow run
3. View detailed logs for each job
4. Look for specific error messages
5. Reproduce locally with the same commands

Common issues:
- **TypeScript errors**: Fix type errors locally with `pnpm typecheck`
- **Build errors**: Check `pnpm build` output locally
- **Test failures**: Run `pnpm test -- --run` locally and check error messages
- **Dependency issues**: Ensure `pnpm-lock.yaml` is committed and up-to-date

## Performance Optimization

Current CI runs all three jobs in parallel (faster):
- TypeScript: ~30-45 seconds
- Build: ~45-60 seconds  
- Tests: ~30-45 seconds

To optimize further:
- Cache artifacts between jobs
- Reduce test run time (currently 51 tests run sequentially)
- Split jobs by test file for parallel execution

## Next Steps

1. ✅ GitHub Actions CI configured
2. ⏳ Set up branch protection rules in GitHub
3. ⏳ (Optional) Configure Husky for local pre-commit checks
4. ⏳ (When ready) Configure ESLint and enable lint job
