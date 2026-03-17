# Dependency Management Scripts

This directory contains scripts to help manage and fix dependency security issues, particularly those flagged by Dependabot.

## Scripts

### 1. `fix-dependabot-issues.js`

Automatically checks for Dependabot alerts and fixes dependency issues.

**Usage:**

```bash
node scripts/fix-dependabot-issues.js
```

**What it does:**

- Fetches Dependabot security alerts from GitHub
- Runs `pnpm audit` to check for vulnerabilities
- Applies `pnpm audit --fix` to automatically fix issues
- Updates dependencies with `pnpm install`
- Checks for outdated packages
- Generates a detailed report

**Requirements:**

- Node.js 24.12.0 or higher
- pnpm 8.10.0 or higher
- GitHub CLI (`gh`) installed and authenticated (optional, for Dependabot alerts)

**Install GitHub CLI:**

```bash
brew install gh
gh auth login
```

### 2. `check-dependabot.sh`

Checks Dependabot alerts and open PRs without making changes.

**Usage:**

```bash
chmod +x scripts/check-dependabot.sh
./scripts/check-dependabot.sh
```

**What it does:**

- Lists all active Dependabot security alerts
- Shows open Dependabot PRs
- Displays outdated packages
- Provides recommendations for fixing issues

**Requirements:**

- GitHub CLI (`gh`) installed and authenticated
- Bash shell

### 3. GitHub Workflow: `dependabot-auto-fix.yml`

Automatically runs dependency fixes on a schedule.

**Features:**

- Runs daily at 9 AM UTC
- Can be manually triggered
- Automatically commits and pushes fixes
- Generates detailed summary reports
- Uploads audit reports as artifacts

**Manual trigger:**

```bash
gh workflow run dependabot-auto-fix.yml
```

Or via GitHub UI: Actions → Dependabot Auto-Fix → Run workflow

## Quick Start

### First-time setup

1. Install dependencies:

```bash
pnpm install
```

2. Install GitHub CLI (optional but recommended):

```bash
brew install gh
gh auth login
```

3. Make scripts executable:

```bash
chmod +x scripts/*.sh
```

### Daily workflow

**Check for issues:**

```bash
./scripts/check-dependabot.sh
```

**Fix issues:**

```bash
node scripts/fix-dependabot-issues.js
```

**Review changes:**

```bash
git status
git diff package.json pnpm-lock.yaml
```

**Test:**

```bash
pnpm dev
```

**Commit:**

```bash
git add .
git commit -m "fix: resolve dependency security issues"
git push
```

## Automated Workflow

The GitHub Actions workflow (`.github/workflows/dependabot-auto-fix.yml`) can handle this automatically:

1. Runs daily
2. Checks for issues
3. Applies fixes
4. Commits changes
5. Creates detailed reports

You can also run it manually:

- Go to Actions tab in GitHub
- Select "Dependabot Auto-Fix"
- Click "Run workflow"

## Best Practices

1. **Review before committing**: Always review the changes made by automated fixes
2. **Test thoroughly**: Run your test suite after applying fixes
3. **Check breaking changes**: Some updates may include breaking changes
4. **Use overrides carefully**: The `pnpm.overrides` in package.json can force specific versions
5. **Monitor regularly**: Check for security issues weekly

## Manual Override Management

If automatic fixes aren't working, you can manually add overrides to `package.json`:

```json
{
  "pnpm": {
    "overrides": {
      "vulnerable-package": "safe-version"
    }
  }
}
```

Then run:

```bash
pnpm install
```

## Troubleshooting

**GitHub CLI not working:**

```bash
gh auth status
gh auth login
```

**Audit fix not resolving issues:**

- Check if manual overrides are needed
- Some vulnerabilities may require major version updates
- Review Dependabot PR suggestions

**Workflow not running:**

- Check repository permissions
- Verify workflow file is in `.github/workflows/`
- Check workflow logs in Actions tab

## Additional Resources

- [pnpm audit documentation](https://pnpm.io/cli/audit)
- [GitHub Dependabot documentation](https://docs.github.com/en/code-security/dependabot)
- [GitHub CLI documentation](https://cli.github.com/)
