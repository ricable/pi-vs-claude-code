# Claude Flow CLI Commands Reference

26 commands, 140+ subcommands. Install: `npx @claude-flow/cli@latest`

## init - Project Initialization
```
init                    Interactive project init
init --wizard           Guided wizard setup
init --v3-mode          Enable all v3 features
init --topology TYPE    Set default topology
```

## agent - Agent Lifecycle
```
agent spawn -t TYPE --name NAME    Create typed agent
agent list                         List active agents
agent stop --name NAME             Stop specific agent
agent stop --all                   Stop all agents
agent exec --name NAME --task MSG  Execute task on agent
agent status --name NAME           Check agent state
agent restart --name NAME          Restart agent
agent logs --name NAME             View agent logs
```

## swarm - Multi-Agent Coordination
```
swarm init --topology TYPE --max-agents N --strategy STRAT    Initialize swarm
swarm status                     Check swarm health
swarm scale --count N            Scale agent count
swarm stop                       Stop all swarm agents
swarm topology                   View current topology
swarm metrics                    View swarm performance
```

## memory - HNSW Vector Memory
```
memory store --key K --value V [--namespace NS] [--ttl T] [--tags TAG1,TAG2]
memory search --query Q [--namespace NS] [--limit N] [--threshold T]
memory retrieve --key K [--namespace NS]
memory list [--namespace NS] [--limit N]
memory delete --key K [--namespace NS]
memory stats                     Storage statistics
memory export --file PATH        Export memory to file
memory import --file PATH        Import memory from file
memory clear --namespace NS      Clear namespace
memory optimize                  Optimize HNSW index
memory compact                   Compact storage
```

## task - Task Management
```
task create --title T --description D [--priority P]
task assign --id ID --agent NAME
task status --id ID
task complete --id ID
task list [--status STATUS]
task cancel --id ID
```

## session - Session State
```
session start --name NAME
session save
session restore --name NAME
session list
session delete --name NAME
session export --file PATH
session import --file PATH
```

## hooks - Event-Driven Automation
```
hooks add --event EVENT --handler CMD --name NAME
hooks list
hooks enable --name NAME
hooks disable --name NAME
hooks remove --name NAME
hooks trigger --event EVENT
hooks status
```

## hive-mind - Byzantine Consensus
```
hive-mind init --consensus TYPE
hive-mind propose --topic T --options OPT1,OPT2
hive-mind vote --topic T --choice C
hive-mind status --topic T
hive-mind result --topic T
hive-mind history
```

## security - Security & Defence
```
security scan [--deep] [--pii] [--cve]
security secrets --path PATH
security defend --input TEXT --level LEVEL
security threats --model MODEL
security audit --report
security policy --list
```

## performance - Benchmarking
```
performance benchmark [--iterations N]
performance profile [--duration S]
performance metrics
performance optimize
performance report
```

## mcp - MCP Server
```
mcp start [--transport TYPE] [--port N]
mcp stop
mcp tools
mcp exec --tool TOOL --args JSON
mcp status
```

## providers - LLM Providers
```
providers add --name NAME --key KEY
providers list
providers default --name NAME
providers remove --name NAME
providers test --name NAME
```

## plugins - Plugin Management
```
plugins install --name NAME [--source SRC]
plugins create --name NAME
plugins list
plugins publish --name NAME
plugins remove --name NAME
```

## deploy - Deployment
```
deploy --env ENV --version VER
deploy --env ENV --dry-run
deploy rollback --env ENV
deploy list --env ENV
deploy status --env ENV
```

## daemon - Background Service
```
daemon start
daemon stop
daemon status
daemon restart
```

## doctor - Diagnostics
```
doctor              Run diagnostics
doctor --fix        Auto-fix issues
doctor --verbose    Detailed output
```

## claims - Authorization
```
claims assign --agent NAME --role ROLE
claims check --agent NAME --action ACT --resource RES
claims enforce --policy POLICY
claims list --agent NAME
```

## workflow - CI/CD
```
workflow create --name NAME
workflow dispatch --name NAME
workflow list
workflow status --name NAME
```

## guidance - Policy Control
```
guidance policy --list
guidance enforce --policy NAME
guidance report
```
