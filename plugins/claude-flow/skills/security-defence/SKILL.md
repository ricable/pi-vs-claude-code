---
name: claude-flow-security-defence
description: >
  Security scanning and AI defence for agent workflows. Use for CVE detection, secret scanning,
  PII detection, prompt injection defence (AIDefence/AIMDS), threat modeling, and security
  auditing. Includes 25-level meta-learning adaptive mitigation.
---

# Security & AIDefence

## Security Scanning

```bash
# Full deep scan
npx @claude-flow/cli@latest security scan --deep

# Secret detection
npx @claude-flow/cli@latest security secrets --path ./src

# PII scanning
npx @claude-flow/cli@latest security scan --pii

# CVE check against dependencies
npx @claude-flow/cli@latest security scan --cve

# Threat modeling
npx @claude-flow/cli@latest security threats --model stride
```

## AIDefence (AIMDS)

AI Manipulation Defense System with real-time protection:

### MCP Tools
| Tool | Purpose |
|------|---------|
| `aidefence_analyze` | Deep analysis of input for manipulation |
| `aidefence_is_safe` | Quick safety check (boolean) |
| `aidefence_has_pii` | PII detection in text |
| `aidefence_scan` | Scan code/config for vulnerabilities |
| `aidefence_learn` | Learn new attack patterns |
| `aidefence_stats` | View detection statistics |

### Defence Levels

| Level | Mode | False Positive Rate | Use Case |
|-------|------|-------------------|----------|
| `permissive` | Low filtering | Higher | Development, testing |
| `standard` | Balanced | Medium | General use |
| `strict` | Aggressive filtering | Lower | Production, sensitive data |
| `paranoid` | Maximum protection | Lowest | Financial, healthcare |

```bash
# Standard defence check
npx @claude-flow/cli@latest security defend --input "user text" --level standard

# Strict mode for production
npx @claude-flow/cli@latest security defend --input "user text" --level strict
```

### Threat Categories Detected

- **Prompt injection**: Direct and indirect injection attempts
- **Jailbreak**: System prompt override attempts
- **Data exfiltration**: Attempts to extract sensitive data
- **Social engineering**: Manipulation through conversation
- **PII leakage**: Personal identifiable information exposure
- **Code injection**: Malicious code insertion attempts

## Security Audit Workflow

1. Run deep scan: `security scan --deep`
2. Check secrets: `security secrets --path ./`
3. Check CVEs: `security scan --cve`
4. Run AIDefence: `security defend --level strict`
5. Generate report: `security audit --report`

## Agent Security Rules

- NEVER hardcode API keys or credentials
- NEVER commit .env files
- Validate all external input at system boundaries
- Sanitize file paths to prevent directory traversal
- Use parameterized queries for database operations
- Run security scan after any security-related changes

## Claims-Based Authorization

Control agent permissions with claims:

```bash
# Assign role to agent
npx @claude-flow/cli@latest claims assign --agent my-coder --role developer

# Check permissions
npx @claude-flow/cli@latest claims check --agent my-coder --action "file:write" --resource "./src"

# Enforce policy
npx @claude-flow/cli@latest claims enforce --policy "no-root-access"
```
