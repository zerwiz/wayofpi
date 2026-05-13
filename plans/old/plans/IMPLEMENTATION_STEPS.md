# Pi Rule System Implementation Steps

> **Project**: Step-by-step implementation guide for Pi rule system
> **Target**: Production compliance
> **Last Updated**: 2025-06-15

---

## 🎯 Objective

Guide developers through creating the **Pi agent rule system** that agents can automatically use for compliance checking.

---

## 📋 Phase 1: Foundations (Weeks 1-2)

### Step 1.1: Project Setup

```bash
# Create project structure
mkdir -p ~/.pi/agent/rules/validation
cd ~/.pi/agent/rules/validation

# Initialize project
npm init -y

# Add dependencies
npm install tsx @mariozechner/pi-coding-agent
```

### Step 1.2: Core Parser Module

**File**: `src/parser.ts`

```typescript
import { PiAgent } from "@mariozechner/pi-coding-agent";

export interface RuleDocument {
  name: string;
  content: string;
  format: "markdown" | "typescript" | "json";
  rules: string[];
}

export class RuleParser {
  async parseFile(path: string): Promise<RuleDocument> {
    const content = await PiAgent.readFile(path);
    
    if (path.endsWith(".md")) {
      // Parse markdown rules
      return this.parseMarkdown(content);
    } else if (path.endsWith(".ts")) {
      // Parse TypeScript extensions
      return this.parseTypeScript(content);
    }
    
    throw new Error(`Unsupported format: ${path}`);
  }
  
  parseMarkdown(content: string): RuleDocument {
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    const frontmatter = frontmatterMatch?.[1] || "";
    
    const rules = this.extractRules(content);
    
    return {
      name: path,
      content,
      format: "markdown",
      rules,
    };
  }
}
```

### Step 1.3: Core Validator Module

**File**: `src/validator.ts`

```typescript
export class RuleValidator {
  async validate(rules: RuleDocument[]): Promise<{
    valid: boolean;
    violations: Array<{
      rule: string;
      severity: "critical" | "high" | "medium" | "low";
      message: string;
    }>;
  }> {
    const violations: ValidationIssue[] = [];
    
    for (const rule of rules) {
      // Rule P1.1: Check package manifest
      this.checkPackageManifest(rule, violations);
      
      // Rule P1.10: Multi-agent packaging
      this.checkMultiAgentPackaging(rule, violations);
      
      // Rule E1.1: Error exit codes
      this.checkErrorCodes(rule, violations);
      
      // Security checks
      this.checkSecurityPolicies(rule, violations);
    }
    
    return {
      valid: violations.length === 0,
      violations,
    };
  }
}
```

### Step 1.4: Error Code Validator

**File**: `src/error-checker.ts`

```typescript
import { PiAgent } from "@mariozechner/pi-coding-agent";

const ERROR_CODES: Record<number, string> = {
  0: "Success",
  1: "Invalid arguments/configuration",
  2: "Agent failure",
  3: "File system error",
  4: "Network error",
  5: "Model unavailable",
  6: "Permission denied",
  7: "Schema validation failed",
};

export class ErrorChecker {
  validateExitCode(code: number): string | null {
    if (code < 0 || code > 7) {
      return `Invalid exit code: ${code} (must be 0-7)`;
    }
    return null;
  }
}
```

---

## 🔐 Phase 2: Security Enforcement (Weeks 3-5)

### Step 2.1: Permission Scoping Validator

**File**: `src/permission-validator.ts`

```typescript
interface Permission {
  filesystem?: boolean;
  network?: boolean;
  process?: boolean;
  secrets?: boolean;
  admin?: boolean;
  sudo?: boolean;
}

export class PermissionValidator {
  async validatePermissions(
    packageJson: any,
    operations: string[]
  ): Promise<ValidationResult> {
    const requiredPermissions = this.calculateRequiredPermissions(operations);
    
    // Rule S1.1.1: Permission scoping
    if (!packageJson.permissions) {
      return {
        valid: false,
        violations: [
          {
            rule: "S1.1.1",
            severity: "critical",
            message: "Missing permissions declaration",
          },
        ],
      };
    }
    
    // Check each requested permission
    for (const [perm, required] of Object.entries(requiredPermissions)) {
      if (required && !packageJson.permissions[perm as keyof Permission]) {
        return {
          valid: false,
          violations: [
            {
              rule: "S1.1.1",
              severity: "critical",
              message: `Missing permission: ${perm}`,
            },
          ],
        };
      }
    }
    
    return { valid: true, violations: [] };
  }
}
```

### Step 2.2: Secret Management Validator

**File**: `src/secret-validator.ts`

```typescript
export class SecretValidator {
  checkSecretExposure(code: string): ValidationIssue[] {
    const violations: ValidationIssue[] = [];
    
    // Rule S1.1.2: Secret management
    const secrets = this.detectSecrets(code);
    
    for (const secret of secrets) {
      violations.push({
        rule: "S1.1.2",
        severity: "critical",
        message: `Hardcoded secret detected: ${secret}`,
      });
    }
    
    return violations;
  }
}
```

### Step 2.3: Sandbox Executor

**File**: `src/sandbox-executor.ts`

```typescript
export async function executeInSandbox(command: string, sandboxPath: string): Promise<string> {
  // Rule S1.1.3: Sandbox execution
  
  const timeout = setTimeout(() => {
    // Timeout after 30 seconds
  }, 30_000);
  
  try {
    const result = await PiAgent.bash(command, {
      cwd: sandboxPath,
      timeout: 30,
      sandbox: true,
    });
    
    clearTimeout(timeout);
    return result;
  } catch (e) {
    throw e;
  }
}
```

---

## ⚡ Phase 3: Performance & Monitoring (Weeks 6-7)

### Step 3.1: Memory Overhead Tracker

**File**: `src/memory-tracker.ts`

```typescript
export class MemoryTracker {
  constructor(readonly limit: number = 5 * 1024) {}
  
  checkMemoryUsage(): boolean {
    const usedMemory = process.memoryUsage().rss;
    return usedMemory >= this.limit * 1024;
  }
}
```

### Step 3.2: Latency Monitor

**File**: `src/latency-monitor.ts`

```typescript
export class LatencyMonitor {
  checkLatency(duration: number): boolean {
    return duration > 100; // Must be <100ms
  }
}
```

---

## 📊 Phase 4: Reporting & Dashboards (Weeks 8-9)

### Step 4.1: Compliance Report Generator

**File**: `src/report-generator.ts`

```typescript
export class ReportGenerator {
  generateReport(
    validations: ValidationResult[],
    rules: RuleDocument[]
  ): string {
    const report = [];
    
    report.push("## Compliance Report");
    report.push("");
    
    for (const validation of validations) {
      report.push(`### ${validation.rule} (${validation.severity})`);
      report.push(`\`${validation.message}\``);
    }
    
    return report.join("\n");
  }
}
```

### Step 4.2: Dashboard API

**File**: `src/dashboard-api.ts`

```typescript
export interface DashboardStats {
  critical: number;
  high: number;
  medium: number;
  low: number;
  complianceRate: number;
}

export class DashboardAPI {
  async getDashboard(): Promise<DashboardStats> {
    const stats = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      complianceRate: 100,
    };
    
    // Collect from all validations
    for (const validation of validations) {
      stats[validation.severity]++;
    }
    
    return stats;
  }
}
```

---

## 🧪 Phase 5: Testing & QA (Weeks 10-11)

### Step 5.1: Unit Tests

**File**: `src/test/parser.test.ts`

```typescript
import { describe, it } from "node:test";
import { RuleParser } from "../parser";

describe("RuleParser", () => {
  it("should parse markdown files", async () => {
    const rules = new RuleParser();
    const doc = await rules.parseFile("rules/packages.md");
    
    assert.equal(doc.format, "markdown");
    assert.equal(doc.rules.length, > 0);
  });
});
```

---

## ✨ Phase 6: Documentation (Week 12)

### Step 6.1: API Documentation

**File**: `docs/api.md`

```markdown
## RuleSystem API

### Validate Rule

```typescript
import { RuleSystem } from "pi-rule-system";

const system = new RuleSystem();

// Validate extension
const result = await system.validate("/path/to/extension.ts");

if (!result.valid) {
  for (const violation of result.violations) {
    console.error(violation.message);
  }
}
```

### Check Permissions

```typescript
const perms = await system.checkPermissions(file);

if (!perms.valid) {
  console.error("Missing: ", perms.required);
}
```
```

---

## 📋 Sign-Off

- [ ] Step 1.1: Project Setup ✅
- [ ] Step 1.2: Parser Module ✅
- [ ] Step 1.3: Core Validator ✅
- [ ] Step 1.4: Error Checker ✅
- [ ] Step 2.1: Permission Validator
- [ ] Step 2.2: Secret Validator ✅
- [ ] Step 2.3: Sandbox Executor ✅
- [ ] Step 3.1: Memory Tracker ✅
- [ ] Step 3.2: Latency Monitor ✅
- [ ] Step 4.1: Report Generator
- [ ] Step 4.2: Dashboard API ✅
- [ ] Step 5.1: Tests ✅

---

**Status**: 📋 IN PROGRESS
**Last Updated**: 2025-06-15
