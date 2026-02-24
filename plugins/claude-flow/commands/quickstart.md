# Quick Start

## 1. Install & Configure

```bash
claude mcp add claude-flow -- npx -y @claude-flow/cli@latest
npx @claude-flow/cli@latest daemon start
npx @claude-flow/cli@latest doctor --fix
```

## 2. Initialize Project

```bash
npx @claude-flow/cli@latest init --wizard
```

## 3. Spawn Your First Agent

```bash
npx @claude-flow/cli@latest agent spawn -t coder --name my-coder
```

## 4. Run a Swarm

```bash
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
```

## 5. Store a Pattern

```bash
npx @claude-flow/cli@latest memory store --key "my-pattern" --value "learned approach" --namespace patterns
```

## 6. Search Knowledge

```bash
npx @claude-flow/cli@latest memory search --query "how to handle auth" --limit 5
```

## 7. Health Check

```bash
npx @claude-flow/cli@latest doctor --fix
```
