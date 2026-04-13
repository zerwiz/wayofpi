# Plan: Build Good GitHub Push System for Way of Pi

**Status:** planning
**Created:** 2025-03-11
**Revision:** 1
**Session cwd:** /way-of-pi
**Sources:** User request for proper Git/GitHub workflow system

---

## Goal

Build a robust **GitHub push system** that enforces:
- Feature branch workflows (no direct pushes to main)
- Pull request reviews before merge
- Automated CI/CD checks before merge
- Release/version management
- Secure, auditable commits
- Proper conflict resolution
- Branch protection and policies

---

## Background

Currently, users push directly to `main` branch without:
- Creating feature branches
- Code reviews
- Automated testing
- Version tagging
- Security scanning

This leads to potential bugs, security issues, and deployment problems.

---

## Assumptions and Constraints

- **GitHub PAT** (Personal Access Token) available for API access
- **Way of Pi client repo** accessible (client repository exists)
- **Bun/Node.js** available for local development
- **CI/CD platform:** GitHub Actions recommended (native)
- **Branch protection rules** via GitHub UI
- **CI/CD:** Run tests on PR, require 1+ review approved
- **Security:** CodeQL or Dependabot for vulnerability scanning

---

## Files to Create

| Path | Action | Purpose |
|--|--------|--------|
| `.github/workflows/ci.yml` | Create | CI pipeline for PRs |
| `.github/workflows/release.yml` | Create | Release management |
| `.github/PULL_REQUEST_TEMPLATE.md` | Create | Pull request guidelines |
| `.gitmessage` | Create | Commit message convention |
| `.git-blame-ignore-revs` | Create | Ignore specific revisions |
| `docs/GIT-PUSH-WORKFLOW.md` | Create | Git workflow documentation |
| `scripts/pre-commit.sh` | Create | Pre-commit hooks |
| `.pre-commit-config.yaml` | Create | Pre-commit hooks config |
| `.github/SECURITY.md` | Create | Security policies |

---

## Implementation Steps (Ordered)

### Phase 1: Branch Protection Setup

#### Step 1: Configure Branch Protection
```bash
# Via GitHub UI > Settings > Branches
- Enable branch protection rules
- Require pull requests before merging
- Require up-to-date main
- Require status checks to pass
- Require code review (1 approval)
- Block force pushes
- Delete branch on merge
```

#### Step 2: Configure Branch Naming Conventions
```bash
Convention:
  feature/chat-ui-fixes        # Features
  bugfix/keep-button-issue      # Bug fixes
  chore/context-meter-fix       # Chore/tasks
  docs/git-workflow-update      # Documentation
  hotfix/security-patch-v1.2    # Hotfixes

Pattern: <type>/<description>-<issue-id>
```

#### Step 3: Configure Merge Strategies
```bash
- Rebase instead of merge commit (optional)
- Squash commits before merge
- Commit message body limited to 72 chars
- All changes must pass CI checks
```

---

### Phase 2: CI/CD Pipeline

#### Step 1: CI Pipeline (`.github/workflows/ci.yml`)

```yaml
name: CI Pipeline

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      - name: Install dependencies
        run: bun install
      - name: Run lint
        run: bun run lint
      - name: Run tests
        run: bun test
      - name: Build
        run: bun run build
      - name: Audit dependencies
        run: bun audit

  security-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Snyk
        uses: snyk/actions/node@latest
        with:
          args: --file=package.json

  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      - name: Run coverage
        run: bun cover && bun coverage
```

#### Step 2: PR Status Checks
- `ci:tests` - Unit tests pass
- `ci:lint` - ESLint/Prettier passes
- `ci:security` - Snyk/Dependabot passes
- `test:coverage` - Coverage meets threshold (e.g., >80%)

---

### Phase 3: Release Management

#### Step 1: Semantic Versioning
```bash
Version: <major>.<minor>.<patch>
- major: Breaking changes
- minor: New features (backward compatible)
- patch: Bug fixes

Examples:
  1.0.0 - Initial release
  1.1.0 - New features
  1.1.1 - Bug fixes
```

#### Step 2: Release Branch Strategy
```bash
  main (stable)
       \
        \--> v1.0.0
             \
              \--> v1.1.0
```

#### Step 3: Release Automation
```bash
When CI passes + PR approved:
  • Bump version
  • Create release tag
  • Publish release notes
  • Update CHANGELOG.md
```

---

### Phase 4: Pre-commit Hooks

#### Step 1: Configure `.pre-commit-config.yaml`
```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
      - id: check-merge-conflict

  - repo: local
    hooks:
      - id: git-hook
        name: Git hook
        entry: bash .git-blame-ignore-revs
        language: system
```

#### Step 2: Pre-commit Checklist
```
Before every commit
  [✓] Run pre-commit hooks
  [✓] Check git blame for ignored revisions
  [✓] Ensure no sensitive info in commit
  [✓] Follow commit message convention
  [✓] Code passes local tests
```

---

### Phase 5: Conflict Resolution

#### Step 1: Conflict Detection Strategy
```bash
# On merge conflicts:
# 1. Pull latest from main: git pull origin main
# 2. Address conflicts in editor
# 3. Stage resolved files: git add .
# 4. Commit: git commit -m "Merge: resolved conflicts"
# 5. Push: git push
```

#### Step 2: Automated Conflict Handling
```yaml
Automated steps:
  • Detect conflicts early (CI on PR)
  • Suggest resolution strategies
  • Lock conflicted branches temporarily
  • Notify team of conflicts
```

---

### Phase 6: Documentation

#### Step 1: Pull Request Template
Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Description
<!-- Describe changes in this PR -->

## Type of change
<!-- Check one: -->
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation
- [ ] Chore

## Testing
<!-- What tests were added/updated? -->

## Checklist
- [ ] Self-reviewed
- [ ] Tests pass
- [ ] Code formatted
- [ ] Documentation updated
```

---

## Security Checklist

- [ ] No sensitive credentials committed
- [ ] Dependencies audited
- [ ] PR reviewed by 2+ team members
- [ ] No force pushes
- [ ] Branch protected
- [ ] Security scans pass

---

## Git Hooks Implementation

```bash
# 1. Install hooks
npm install -g npm-run-all
npm run hooks-init

# 2. Configure .gitmessage
editor: -ne"Editor"

# 3. Pre-commit hook
#!/bin/bash
echo "Running pre-commit hooks..."
npm run pre-commit

# 4. Post-commit notification (optional)
npm run post-commit-notifications
```

---

## Workflow Summary

```
1. User works on local development
2. Create feature branch: git checkout -b feature/chat-ui
3. Make changes
4. Pre-commit hooks run automatically
5. Commit: git commit -m "fix: keep button issue #123"
6. Push: git push -u origin feature/chat-ui
7. Pull request created in GitHub
8. CI checks run (CI:tests, CI:lint, CI:security)
9. 1+ reviewer approves PR
10. Merge to main via PR (protected)
11. Release tag created if applicable
12. Tagged release published
```

---

## Verification

- [ ] Branch protection rules enabled
- [ ] CI checks pass on feature branch
- [ ] PR template guidelines followed
- [ ] Pre-commit hooks run automatically
- [ ] No direct pushes to main branch
- [ ] Code is reviewed before merge
- [ ] Releases follow semantic versioning
- [ ] Conflict resolution documented and tested

---

## Team Roles

- **planner:** Create workflow documentation, templates
- **builder:** Implement CI/CD, hooks
- **reviewer:** Review PRs, security checks
- **bowser:** QA testing, conflict resolution
- **ralph:** Manage release tags, versions

---

## Risks and Mitigations

| Risk | Mitigation |
|--|------------|
| Merge conflicts | Clear communication; feature branches; rebase if needed |
| Review delays | Auto-assign reviewers; set SLA; PR auto-close after 3 days |
| Security vulnerabilities | Dependabot alerts; Snyk scanning; quick patching |
| Accidental main push | Branch protection; hooks block direct push |
| Stale PRs | Auto-close if no activity; notify owners |

---

## Notes

This document serves as **implementation plan** for GitHub push system. Create these files in Way of Pi client repo.

Ready for build team to start implementation!