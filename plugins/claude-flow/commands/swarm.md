# Swarm Commands

## Initialize
```bash
# Coding swarm (default)
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized

# Research swarm
npx @claude-flow/cli@latest swarm init --topology mesh --max-agents 5 --strategy collaborative

# Pipeline swarm
npx @claude-flow/cli@latest swarm init --topology ring --max-agents 4 --strategy pipeline
```

## Monitor
```bash
npx @claude-flow/cli@latest swarm status
npx @claude-flow/cli@latest swarm metrics
```

## Scale
```bash
npx @claude-flow/cli@latest swarm scale --count 10   # scale up
npx @claude-flow/cli@latest swarm scale --count 4    # scale down
```

## Stop
```bash
npx @claude-flow/cli@latest swarm stop
```

## Hive-Mind Consensus
```bash
npx @claude-flow/cli@latest hive-mind init --consensus raft
npx @claude-flow/cli@latest hive-mind propose --topic "decision" --options "a,b,c"
npx @claude-flow/cli@latest hive-mind vote --topic "decision" --choice "b"
npx @claude-flow/cli@latest hive-mind status --topic "decision"
```
