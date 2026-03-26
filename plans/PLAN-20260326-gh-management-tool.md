# Plan: GitHub Management CLI Tool

**Status:** implement  
**Created:** 2026-03-26  
**Revision:** 2  
**Session cwd:** /home/zerwiz/.pi  
**Sources:** github-management-reviewer-feedback.txt, PLAN-20260326-gh-management-tool.md.rev, Pi project docs

---

## Goal

---

## Goal

Build a comprehensive GitHub management CLI tool (named `ghm`) that enables developers to perform common Git/GitHub operations including repository cloning, pushing/pulling changes, branch management, pull request operations, status checking, and repository listing. The tool will use **GitHub CLI (`gh`) as the authentication and operation layer**, with native `git` commands for local operations, and provide a unified wrapper interface with proper error handling, ANSI color output, and table formatting.

---

## Assumptions and constraints

- **Environment:** Node.js/Bun environment with Pi extension framework available
- **Authentication strategy:** **gh CLI wrapper approach** — Use `gh auth status` to check auth, `gh auth token` to get token for API calls. The tool acts as a thin API over `gh` CLI for auth operations, using native git for repo operations.
- **CLI invocation mechanism:** Tool invoked via `.pi/tools/github-management.js` shim that registers with Pi runner; also installs global `ghm` binary via `ghm install` command
- **Dependencies:**
  - **Core:** `@types/node` (types), `chalk` (colors), `ora` (spinners), `octokit` (REST API fallback)
  - **Shell:** `execa` or `child_process` for running git/gh commands
  - **Optional:** `cli-spinner` for progress indicators
- **Platform:** Linux/macOS/WSL primary; Windows with WSL2 or Cygwin compatible paths
- **Limitations:**
  - No real-time GUI, only terminal CLI
  - Requires pre-configured Git (native git commands)
  - GitHub API rate limits must be respected (40 req/min unauth, 5000/min with auth)
  - Network connectivity required for most operations
  - `gh` CLI 2.0+ required for auth integration

---

## Files to touch

| Path | Action | Notes |
|------|--------|-------|
| `plans/PLAN-20260326-gh-management-tool.md` | Create | This planning document |
| `extensions/github-management.ts` | Create | Main Pi extension implementing the CLI tool |
| `extensions/github-management/commands.ts` | Create | Command registry interface and parsers |
| `extensions/github-management/handlers.ts` | Create | Git/GitHub operation handlers with retry |
| `extensions/github-management/config.ts` | Create | ANSI codes, exit codes, format specs |
| `extensions/github-management/package.json` | Create | Local dependencies for CLI tool |
| `.pi/extensions/github-management.ts` | Create | Shim file for Pi loading |
| `.pi/tools/github-management.js` | Create | CLI shim/entry point for `ghm` command |
| `specs/github-management.md` | Create | Feature specification document |
| `scripts/setup-github-cli.sh` | Create | Bootstrap script for gh CLI installation |
| `scripts/ghm-install.js` | Create | Install `ghm` to PATH |

---

## Implementation steps (ordered)

### Phase 1: Project Setup (1-2 hours)

1. **Create file structure**
   ```bash
   mkdir -p /home/zerwiz/.pi/extensions/github-management
   mkdir -p /home/zerwiz/.pi/tools
   ```

2. **Create shim file for Pi loading**
   ```bash
   echo 'export { default } from "../../extensions/github-management"' > /home/zerwiz/.pi/.pi/extensions/github-management.ts
   ```

3. **Create CLI shim at `.pi/tools/github-management.js`**
   - Entry point that `pi` runner discovers
   - Exposes `registerCommands()` function
   - Routes CLI args to command handlers

4. **Initialize local `package.json`** for CLI dependencies:
   ```json
   {
     "name": "@pi/github-management",
     "version": "1.0.0",
     "type": "module",
     "bin": {
       "ghm": "./cli.js"
     },
     "dependencies": {
       "@types/node": "^20.10.0",
       "chalk": "^5.3.0",
       "cross-env": "^7.0.3",
       "execa": "^8.0.1",
       "lodash": "^4.17.21",
       "ora": "^8.0.1",
       "@octokit/rest": "^20.1.0"
     },
     "devDependencies": {
       "@types/chalk": "^5.2.0",
       "@types/cross-env": "^7.0.1",
       "@types/lodash": "^4.14.198",
       "@types/node": "^20.10.0",
       "@types/ora": "^3.2.0",
       "typescript": "^5.3.2"
     }
   }
   ```

5. **Create bootstrap script `scripts/setup-github-cli.sh`**
   - Installs `gh` CLI if not present (`brew install gh` or `sudo apt install gh`)
   - Checks for `gh auth login` completion

### Phase 2: Core Command Architecture (3-4 hours)

1. **Define command interface** (`extensions/github-management/commands.ts`)
   - Type-safe command registry with metadata
   - Commands:
     - `login` / `logout` — GitHub authentication
     - `repo list` — List repositories
     - `clone [url]` — Clone repositories
     - `push [branch]` — Push changes
     - `pull [branch]` — Pull changes
     - `status [repo]` — Check status
     - `branch [subcommand]` — Branch operations (list, create, delete, switch, checkout)
     - `pr` — Pull request operations (list, create, close, merge)
     - `fork [repo]` — Fork repositories
     - `help` — Display commands help

2. **Implement command parser**
   - Parse CLI-style arguments: `ghm push main`
   - Handle subcommands: `ghm branch list`, `ghm branch create main`
   - Provide fallback help on unknown commands

### Phase 3: Operation Handlers with Retry Logic (4-5 hours)

1. **Create shared error handling utility** (`extensions/github-management/errors.ts`)
   ```typescript
   // Concrete error handling examples with retry logic
   export class GitHubError extends Error {
     public readonly statusCode?: number;
     public readonly retryAfter?: number; // seconds from 429 response
     public readonly exitCode: number;
   
     constructor(message: string, statusCode?: number) {
       super(message);
       this.statusCode = statusCode;
       // Exit code: 3=network/auth error, 2=auth error, 1=command error
       const baseCode = statusCode >= 429 ? 3 : statusCode >= 400 ? 2 : 1;
       this.exitCode = baseCode;
     }
   }
   
   // Exponential backoff retry helper
   export async function withRetry<T>(
     operation: () => Promise<T>,
     maxRetries = 3,
     baseDelay = 1000
   ): Promise<T> {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await operation();
       } catch (error: any) {
         const ghError = error as GitHubError;
         if (ghError.statusCode !== 429 && !ghError.message.includes('ECONNREFUSED')) {
           throw error;
         }
         const delay = baseDelay * Math.pow(2, i);
         console.warn(`⚠ ${ghError.message} — Retrying in ${delay}ms...`);
         // Add sleep function import here
         await sleep(delay + (ghError.retryAfter || 0));
       }
     }
     throw new GitHubError(`Max retries (${maxRetries}) exceeded: ${this.message}`, 503);
   }
   ```

2. **Implement `push` handler with conflict detection**
   ```typescript
   export async function handlePush(repo?: string, branch?: string): Promise<void> {
     try {
       // 1. Check auth
       const authCheck = await execWithAuth('gh auth status');
       if (!authCheck.status) throw new GitHubError('Not authenticated', 401);
   
       // 2. Check for uncommitted changes
       const statusOutput = await exec('git status --porcelain');
       if (statusOutput.stdout && statusOutput.stdout.trim()) {
         const proceed = await prompt('Uncommitted changes. Commit before push? (y/n)');
         if (proceed === 'y') {
           await exec('git add .');
           await exec(`git commit -m "chore: ${branch || 'manual push commit'}"`);
         } else {
           throw new GitHubError('Aborted: local changes not committed', 1);
         }
       }
   
       // 3. Verify branch exists on remote
       const remoteStatus = await exec(`git remote show origin | grep -i "^\\s*behind`);
       if (remoteStatus.stdout?.includes('diverged')) {
         throw new GitHubError(`Branch ${branch} diverged from remote. Merge first.`, 128);
       }
   
       // 4. Push with retry
       await withRetry(() => 
         exec(`git push -u origin ${branch || 'HEAD'}`, { reject: false })
       );
   
       // 5. Format success output with ANSI colors and table
       console.log(chalk.green(`✓ Pushed to origin${branch ? `/${branch}` : ''}`));
       
       // 6. Show status table
       const remoteBranch = branch || 'local branch';
       console.table([{
         remote: chalk.cyan('origin'),
         branch: branch || remoteBranch,
         'status': chalk.green('pushed'),
         'changes behind': chalk.yellow('0')
       }], { 
         styled: true,
         headerColor: chalk.cyan,
         borderColor: chalk.gray 
       });
   
     } catch (error: any) {
       const ghError = error as GitHubError;
       console.error(chalk.red(`✗ Push failed: ${ghError.message}`));
       if (ghError.statusCode === 429) {
         console.error(chalk.yellow(`⚠ Rate limited. Wait ${ghError.retryAfter}s before retrying.`));
       }
       process.exit(ghError.exitCode);
     }
   }
   ```

3. **Implement `pull` handler with conflict detection and automatic recovery**
   ```typescript
   export async function handlePull(targetBranch?: string): Promise<void> {
     const branch = targetBranch || getCurrentBranch();
     
     try {
       // 1. Ensure branch exists locally
       const refExists = await exec(`git show-ref --verify --quiet refs/heads/${branch}`, { reject: false });
       if (!refExists.stdout) {
         console.log(chalk.blue(`📂 Creating branch ${branch}...`));
         await exec(`git checkout -b ${branch}`);
       }
   
       // 2. Fetch with progress spinner
       console.log(chalk.blue(`📥 Fetching from origin...`));
       await withSpinner(() => exec(`git fetch origin ${branch}`));
   
       // 3. Check for merge conflicts
       const diffOutput = await exec(`git diff origin/${branch}...${branch}`);
       const hasConflicts = /^<<<<<<</.test(diffOutput.stdout);
   
       if (hasConflicts) {
         const resolve = await prompt(`Conflicts detected on ${branch}. Auto-resolve? (y/n/Auto)`, ['n', 'y']);
         if (resolve === 'n') throw new GitHubError('Aborted due to conflicts', 1);
         if (resolve !== 'y') {
           console.log(chalk.yellow(`⚠ Conflicts remain. Manual resolution needed.`));
           return;
         }
       }
   
       // 4. Pull with rebase
       await withSpinner(() => exec(`git pull origin ${branch} --rebase`));
   
       // 5. Success output with table showing ahead/behind
       const rebaseStatus = await exec(`git rev-list --counts origin/${branch}..HEAD && git rev-list --counts HEAD..origin/${branch}`);
       const stats = parseAheadBehind(rebaseStatus.stdout);
   
       console.log(chalk.green(`✓ Pulled and rebased ${branch}`));
       
       console.table([{
         branch: chalk.cyan(branch),
         'ahead of origin': stats.ahead || '0',
         'behind origin': stats.behind || '0',
         'local commits ahead': chalk.yellow(stats.ahead || '0')
       }], { 
         styled: true,
         headerColor: chalk.cyan,
         borderStyle: 'single'
       });
   
     } catch (error: any) {
       console.error(chalk.red(`✗ Pull failed: ${error.message}`));
       process.exit(1);
     }
   }
   
   function parseAheadBehind(output: string): { ahead: number; behind: number } {
     const lines = output.trim().split(/\n+/).filter(Boolean);
     let ahead = 0, behind = 0;
     for (const line of lines) {
       const aheadMatch = line.match(/ahead (\d+)/)?.[1];
       const behindMatch = line.match(/behind (\d+)/)?.[1];
       if (aheadMatch) ahead = Number.parseInt(aheadMatch);
       if (behindMatch) behind = Number.parseInt(behindMatch);
     }
     return { ahead, behind };
   }
   ```

4. **Implement `clone` handler with directory safety**
   ```typescript
   export async function handleClone(repo: string, path?: string): Promise<void> {
     const url = path || repo;
     // Resolve to clean path
     let dest = path ? path : inferRepoName(repo);
     const destPath = path ? path : pathTo(dest);
   
     try {
       // Check for existing directory
       if (existsSync(destPath)) {
         const rm = await prompt(`Directory ${destPath} exists. Remove and clone? (y/n)`, ['n']);
         if (rm !== 'y') throw new GitHubError('Directory already exists', 2);
         await exec(`rm -rf ${destPath}.old`, { silent: true });
       }
   
       // Clone with spinner
       console.log(chalk.blue(`📦 Cloning ${chalk.bold(cyan(repo))}...`));
       await withSpinner(() => exec(`git clone ${url} ${destPath}`));
       console.log(chalk.green(`✓ Cloned to ${destPath}`));
   
       // Show repo summary table
       const remote = await exec(`cd ${destPath} && git config remote.origin.url`);
       console.table([{
         'URL': remote.stdout.trim(),
         'dest': chalk.green(destPath),
         'git HEAD': 'main (detached)'
       }], { styled: true });
   
     } catch (error: any) {
       console.error(chalk.red(`✗ Clone failed: ${error.message}`));
       process.exit(3); // Network/remote error
     }
   }
   ```

5. **Implement `branch` handlers** (list, create, delete, switch, checkout)
   ```typescript
   export const branchHandlers = {
     
     list: async () => {
       const branches = await exec('git branch -a').stdout.split('\n').filter(Boolean);
       console.table(branches.map(b => ({
         ref: b.trim(),
         'type': b.includes('*') ? chalk.yellow('local') : chalk.blue('remote'),
         'status': b.includes('*') ? chalk.green('') : chalk.gray('')
       })), { styled: true });
     },
   
     create: async (name: string) => {
       await exec(`git checkout -b ${name}`);
       console.log(chalk.green(`✓ Created and switched to ${name}`));
     },
   
     delete: async (name: string) => {
       await exec(`git push origin --delete ${name}`);
       await exec(`git branch -D ${name}`, { reject: false });
       console.log(chalk.green(`✓ Deleted ${name} from local and remote`));
     },
   
     switch: async (name: string) => {
       await exec(`git checkout ${name}`);
       console.log(chalk.green(`✓ Switched to ${name}`));
     },
   
     checkout: async (name: string) => {
       const exists = await exec(`git show-ref --verify refs/heads/${name}`, { reject: false });
       if (!exists.stdout) {
         console.log(chalk.yellow(`⚠ ${name} not found locally. Creating...`));
         await exec(`git checkout -b ${name}`);
       } else {
         await exec(`git checkout ${name}`);
       }
       console.log(chalk.green(`✓ On ${name}`));
     }
   };
   ```

6. **Implement `pr` handlers using GitHub API via Octokit**
   ```typescript
   import { Octokit } from '@octokit/rest';
   
   const octokit = new Octokit({
     auth: process.env.GITHUB_TOKEN || await getAuthFromGhCli()
   });
   
   export const prHandlers = {
     
     list: async (options: { state?: string; user?: string; sort?: string } = {}) => {
       const state = options.state || 'all';
       const user = options.user || 'self';
       const sort = options.sort || 'created';
   
       const query = `query {
         user(login: "${user}") {
           pullRequests(first: 30, states: "${state}", orderBy: {field: ${sort}, direction: DESC}) {
             nodes {
               number
               title
               state
               url
               createdAt
             }
           }
         }
       }`;
   
       const { data } = await octokit.graphql(query);
       const prs = data.user.pullRequests.nodes;
   
       if (prs.length === 0) {
         console.log(chalk.yellow(`No PRs found (user: ${user}, state: ${state})`));
         return;
       }
   
       console.log(chalk.blue(`Found ${prs.length} PR(s) for ${user}`));
       console.table(prs.map(pr => ({
         number: pr.number,
         title: pr.title,
         state: pr.state,
         'open': chalk.green('open'),
         url: pr.url
       })), { 
         styled: true,
         borderStyle: 'round'
       });
     },
   
     create: async (title: string, options?: { description?: string; head?: string; base?: string }) => {
       if (!options.head) {
         throw new GitHubError('Must specify --head (e.g. --head=feature)');
       }
   
       const data = await octokit.pulls.create({
         owner: process.env.GITHUB_REPOSITORY_OWNER,
         repo: process.env.GITHUB_REPOSITORY_NAME,
         title: title,
         body: options.description,
         head: 'octocat:' + options.head,
         base: options.base || 'main'
       });
   
       console.log(chalk.green(`✓ Created PR #${data.data.number}: ${data.data.title}`));
       console.log(`  URL: ${chalk.cyan(data.data.html_url)}`);
     },
   
     close: async (number: number) => {
       await octokit.pulls.update({
         owner: process.env.GITHUB_REPOSITORY_OWNER,
         repo: process.env.GITHUB_REPOSITORY_NAME,
         pull_number: number,
         state: 'closed'
       });
       console.log(chalk.yellow(`✓ Closed PR #${number}`));
     },
   
     merge: async (number: number, mergeMethod?: 'merge'|'squash'|'rebase') => {
       await octokit.pulls.merge({
         owner: process.env.GITHUB_REPOSITORY_OWNER,
         repo: process.env.GITHUB_REPOSITORY_NAME,
         pull_number: number,
         merge_method: mergeMethod || 'merge'
       });
       console.log(chalk.green(`✓ Merged PR #${number}`));
     }
   };
   ```

7. **Implement `status` handler with detailed output**
   ```typescript
   export async function handleStatus(): Promise<void> {
     const statusOutput = await exec('git status');
     const diffOutput = await exec('git diff --name-status --stat');
     const branch = getCurrentBranch();
     const remoteBranch = await exec('git branch --contains HEAD | grep origin/HEAD').stdout;
   
     console.log(chalk.cyan(`On branch ${branch}`));
     
     // Parse ahead/behind
     const currentHash = await exec('git rev-parse HEAD').stdout.trim();
     const originHash = await exec('git rev-parse origin/HEAD').stdout.trim();
     const isBehind = await exec(`git merge-base --is-ancestor origin/HEAD ${currentHash}`);
     const isAhead = await exec(`git merge-base --is-ancestor ${currentHash} origin/HEAD`, { 
       reject: false 
     });
     let ahead = '0', behind = '0';
     if (!isBehind.stdout) ahead = 'ahead';
     if (!isAhead.stdout) behind = 'behind';
   
     console.table([{
       branch: chalk.cyan(branch),
       'remote branch': remoteBranch || 'N/A',
       ahead: chalk.green(ahead),
       behind: chalk.yellow(behind)
     }], { styled: true });
   
     if (diffOutput.stdout) {
       console.log(chalk.yellow(``));
       console.log(chalk.yellow(`${diffOutput.stdout.trim().slice(0, 1000)}`));
     }
   
     console.log(chalk.green(`✓ Working tree ${statusOutput.stdout.includes('nothing to commit') ? 'clean' : 'dirty'}`));
   }
   ```

8. **Implement `repo list` and `fork` handlers** (similar pattern with Octokit API)

9. **Implement `help` command**
   ```typescript
   export async function handleHelp(): Promise<void> {
     const commands = [
       { name: 'login', desc: 'Authenticate with GitHub CLI', usage: 'ghm login' },
       { name: 'logout', desc: 'Clear GitHub auth token', usage: 'ghm logout' },
       { name: 'repo list', desc: 'List repositories', usage: 'ghm repo list [--compact]' },
       { name: 'clone', desc: 'Clone repository', usage: 'ghm clone <owner/repo> [path]' },
       { name: 'push', desc: 'Push current branch', usage: 'ghm push [branch]' },
       { name: 'pull', desc: 'Pull changes to current branch', usage: `ghm pull [branch]` },
       { name: 'status', desc: 'Check branch status', usage: `ghm status [--local|--remote]` },
       { name: `branch list`, desc: 'List branches', usage: `ghm branch list` },
       { name: `branch create`, desc: 'Create new branch', usage: `ghm branch create <name>` },
       { name: `branch delete`, desc: 'Delete branch', usage: `ghm branch delete <name>` },
       { name: `branch switch`, desc: 'Switch to branch', usage: `ghm branch switch <name>` },
       { name: `branch checkout`, desc: 'Checkout branch', usage: `ghm branch checkout <name>` },
       { name: `pr list`, desc: 'List PRs', usage: `ghm pr list [--state=open|merged]` },
       { name: `pr create`, desc: 'Create PR', usage: `ghm pr create <title> --head=<branch>` },
       { name: `pr close`, desc: 'Close PR', usage: `ghm pr close <number>` },
       { name: `pr merge`, desc: 'Merge PR', usage: `ghm pr merge <number> [--squash|--rebase]` },
       { name: `fork`, desc: 'Fork repository', usage: `ghm fork <owner/repo>` },
       { name: 'help', desc: 'Show this help', usage: 'ghm help' }
     ];
   
     console.log(chalk.bold('GitHub Management CLI (ghm)'));
     console.log(chalk.gray('──────────────────────────────────────────────────────────'));
     console.table(commands, { sorted: 'name', styled: true, borderStyle: 'round' });
     console.log(chalk.gray(``));
     console.log(chalk.gray('Use ' + chalk.yellow('ghm login') + ' to authenticate, then run commands like:'));
     console.log(chalk.gray(chalk.cyan('  $ ghm push main                    ') + '─ push current branch'));
     console.log(chalk.gray(chalk.cyan('  $ ghm branch create feature-x      ') + '─ create new branch'));
     console.log(chalk.gray(chalk.cyan('  $ ghm pr create "Add login"        ') + '─ create PR'));
   }
   ```

10. **Error handling integration**
    - All handlers catch errors and convert to `GitHubError`
    - Log with `chalk.red` prefix, include suggestion
    - Exit with appropriate code
    - Rate limits: show warning, suggest waiting or using higher-tier token

---

## Phase 4: Authentication & GitHub Integration (2-3 hours)

1. **Authentication workflow** (using gh CLI wrapper)
    - Verify `gh` CLI installed: `gh --version`
    - Check auth: `gh auth status` or `gh auth token`
    - Handle token refresh when expired (401/403 responses)

2. **GitHub API client setup**
   - Use Octokit for API fallback
   - Get token: `gh auth token` (returns string token)
   - Default token is in `~/.config/gh/token`
   - Refresh token with `gh auth refresh`

3. **Token refresh and expiration**
   - Check token age: `Date.now() - tokenAt > 4.2e9` (1 year)
   - Auto-refresh on 401 errors
   - Store last-success timestamp in `AuthState`

---

## Phase 5: CLI Output Format Specification (3-4 hours)

1. **ANSI color codes** (`config.ts`)
   - `green`: success messages
   - `red`: error messages
   - `yellow`: warnings
   - `blue`: info messages
   - `magenta`: command output, tables

2. **Table formatting config**
   ```typescript
   const config = {
     headerColor: chalk.cyan,
     borderColor: chalk.gray,
     footerStyle: {},
     borderStyle: 'single'
   };
   ```

3. **Progress indicators** with ora
   - Show progress during clone/pull operations
   - Spinner symbols: `['◐','◓','◑','◒']`
   - Use `spinner` and `spinner.fail()` for errors

4. **Error messages** with suggestions
   ```typescript
   console.log(chalk.yellow(``));
   console.log(chalk.red(`✗ ${operation} failed`));
   console.log(chalk.gray(`─ ${error.message}`));
   console.log(chalk.gray('Suggestions:`));
   errors.suggestions.forEach(s => console.log(chalk.gray(`  ${s}`)));
   console.log(chalk.gray(`Exit code: ${error.exitCode}`));
   ```

5. **Success output templates**
   ```typescript
   console.log(chalk.green(`✓ ${operation} completed`));
   console.table([{
     'remote': 'origin',
     'branch': currentBranch,
     'status': 'pushed',
     'changes behind': '0'
   }], config);
   ```

---

## Phase 6: Comprehensive Testing Strategy (4-6 hours)

1. **Test suite structure** (`test/`)
   - `test/auth.test.ts`: Auth workflow tests
   - `test/commands.test.ts`: CLI command tests
   - `test/handlers.test.ts`: Handler logic tests
   - `test/integration.test.ts`: End-to-end tests

2. **Auth tests** (`test/auth.test.ts`)
   - Check auth with `gh auth status`
   - Handle missing gh CLI
   - Verify token validity

3. **Command tests** (`test/commands.test.ts`)
   - Show help
   - List repos
   - Clone validation
   - Push/pull cycle

4. **Error scenarios**
   - Network failures with retry backoff
   - 429 rate limit detection
   - Clear error for auth failures

5. **Run tests command**
   ```bash
   just test           # Run vitest with watch
   just test:ci        # CI runner
   just lint           # ESLint + TypeCheck
   just build          # Build for production
   ```

6. **Create README for the extension**
   - All commands documented with examples
   - Screenshot (ASCII art) outputs
   - Troubleshooting guide
   - Exit code documentation

7. **Update Pi settings**
   - Add extension to `.pi/settings.json`
   - Verify auto-loading with `pi load github-management`

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| **GitHub API rate limits** | Use token with higher rate limits; warn user when limits hit |
| **Network issues** | Retry with exponential backoff; clear error messages |
| **Authentication complexity** | Leverage `gh` CLI auth flow; provide clear instructions |
| **Conflicting branch names** | Validate before push; offer to abort or rename |
| **Large repository clones** | Show progress; warn about bandwidth |
| **Git configuration differences** | Check git setup early; provide quick-fix guidance |
| **Windows path issues** | Test on Windows if supported; encode paths properly |
| **Memory usage for large repos** | Use streaming APIs; chunk operations |

---

## Verification

- **Command list verification**: `ghm --help` displays all commands
- **Login test**: `ghm login` authenticates successfully
- **Repo list**: `ghm repo list` shows user repos
- **Clone test**: `ghm clone OWNER/REPO` downloads a repo
- **Push test**: Make changes, then `ghm push` updates remote
- **Pull test**: Modify remote, then `ghm pull` fetches changes
- **Branch operations**: `ghm branch list`, `ghm branch create new`, `ghm branch delete new`
- **PR operations**: `ghm pr list`, `ghm pr create` (with validation)
- **Status check**: `ghm status` shows correct branch info

**Exit codes:**
- `0` — Success
- `1` — Command error
- `2` — Authentication error
- `3` — Network/remote error

**Manual verification:**
1. Run `ghm --version` to confirm installation
2. Run `ghm login` and verify auth token is stored
3. Run `ghm repo list` and verify repos are shown
4. Make a test commit locally, run `ghm push` and verify on GitHub
5. Run `ghm pull` and verify changes are fetched

---

## Handoff for next agent

- **Primary artifact:** `plans/PLAN-20260326-gh-management-tool.md`
- **Start with:** Phase 1: Project Setup (step 1 or 2)
- **Avoid:** Touching `.pi/agent-sessions/`, modifying existing extensions without review
- **Parallel agents (optional):**
  - `indexer` agent can run with cwd `/home/zerwiz/.pi` to create INDEX.md
  - `github` skill agent can run with `bash` commands for verification

**Command for dispatcher:**
```bash
dispatch_agent -t planner -e "github-management" -c "Start Phase 1 - create file structure"
```

---

## Appendix: Command Reference

Once implemented, the tool will support:

```
ghm login                     # Authenticate with GitHub
ghm logout                    # Clear auth token
ghm repo list --compact       # List repositories
ghm clone <owner/repo>        # Clone repository
ghm push [branch]             # Push current branch
ghm pull [branch]             # Pull changes to current branch
ghm status --verbose          # Detailed status
ghm branch list               # List local branches
ghm branch create <name>      # Create and checkout branch
ghm branch delete <name>      # Delete branch
ghm branch switch <name>      # Switch to branch
ghm branch checkout <name>    # Checkout without switch
ghm pr list [--user]          # List pull requests
ghm pr create <title>         # Create pull request
ghm pr close <number>         # Close a PR
ghm pr merge <number>         # Merge a PR
ghm fork <owner/repo>         # Fork a repository
ghm help                      # Show all commands
```

---

## Notes

- Consider using `gh` CLI as base and building an API wrapper
- Could integrate with other tools like `justfile` recipes
- Consider adding CI/CD hooks support later in roadmap
- Design patterns: Command pattern for CLI, Strategy pattern for handlers
