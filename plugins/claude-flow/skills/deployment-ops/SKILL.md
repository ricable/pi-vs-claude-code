---
name: claude-flow-deployment-ops
description: >
  Deployment, release management, and operational workflows. Use for deploying agents to
  production, managing releases, rollback operations, environment configuration, and
  CI/CD pipeline integration with GitHub Actions.
---

# Deployment & Operations

## Release Workflow

```bash
# Deploy to environment
npx @claude-flow/cli@latest deploy --env production --version 1.2.0

# Deploy with dry-run
npx @claude-flow/cli@latest deploy --env staging --dry-run

# Rollback to previous version
npx @claude-flow/cli@latest deploy rollback --env production

# List deployments
npx @claude-flow/cli@latest deploy list --env production
```

## Environment Management

| Environment | Purpose | Safety Level |
|-------------|---------|-------------|
| `development` | Local testing | Permissive |
| `staging` | Pre-production validation | Standard |
| `production` | Live deployment | Strict |

## GitHub Release Integration

Use the release-manager agent for automated releases:

```bash
# Via Claude Code Task tool
Task: release-manager agent
  - Changelog generation from commits
  - Version bumping (semver)
  - GitHub release creation
  - Multi-platform deployment
```

## CI/CD Pipeline

GitHub Actions workflow integration:

```bash
# Create workflow
npx @claude-flow/cli@latest workflow create --name ci-pipeline

# Dispatch workflow
npx @claude-flow/cli@latest workflow dispatch --name ci-pipeline
```

## Performance Monitoring

```bash
# Run benchmarks
npx @claude-flow/cli@latest performance benchmark --iterations 100

# Profile execution
npx @claude-flow/cli@latest performance profile --duration 60

# View metrics
npx @claude-flow/cli@latest performance metrics

# Optimize bottlenecks
npx @claude-flow/cli@latest performance optimize
```

## Plugin Management

```bash
# Install a plugin
npx @claude-flow/cli@latest plugins install --name my-plugin --source ipfs://...

# Create a plugin
npx @claude-flow/cli@latest plugins create --name my-plugin

# List installed plugins
npx @claude-flow/cli@latest plugins list

# Publish to registry
npx @claude-flow/cli@latest plugins publish --name my-plugin
```

## Health Monitoring

```bash
# Full diagnostics
npx @claude-flow/cli@latest doctor --fix

# Daemon health
npx @claude-flow/cli@latest daemon status

# Memory usage
npx @claude-flow/cli@latest memory stats

# Swarm health
npx @claude-flow/cli@latest swarm status
```

## Rollback Strategy

1. **Automatic**: `post-task` hook detects failure, triggers rollback
2. **Manual**: `deploy rollback --env production`
3. **Selective**: `deploy rollback --env production --component api-server`

Always run `doctor --fix` after rollback to verify system health.
