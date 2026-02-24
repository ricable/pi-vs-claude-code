# MCP Tools Catalog (213+)

## Coordination Tools (~40)

| Tool | Parameters | Description |
|------|-----------|-------------|
| `swarm_init` | topology, max_agents, strategy | Initialize a swarm |
| `swarm_status` | - | Get swarm health |
| `swarm_scale` | count | Scale agent count |
| `swarm_stop` | - | Stop all agents |
| `agent_spawn` | type, name, config | Create new agent |
| `agent_list` | - | List active agents |
| `agent_stop` | name | Stop agent |
| `agent_exec` | name, task | Execute task on agent |
| `task_orchestrate` | tasks, strategy | Orchestrate multi-task |
| `task_create` | title, description, priority | Create task |
| `task_assign` | id, agent | Assign task to agent |
| `task_status` | id | Check task status |
| `task_complete` | id, result | Mark task done |
| `coordination_sync` | agents, data | Sync state across agents |
| `parallel_execute` | tasks | Run tasks in parallel |
| `load_balance` | tasks, agents | Distribute work |

## Memory Tools (~15)

| Tool | Parameters | Description |
|------|-----------|-------------|
| `memory_store` | key, value, namespace, ttl, tags | Store data |
| `memory_search` | query, namespace, limit, threshold | Semantic search |
| `memory_retrieve` | key, namespace | Get by key |
| `memory_list` | namespace, limit | List entries |
| `memory_delete` | key, namespace | Remove entry |
| `memory_stats` | - | Storage statistics |
| `memory_export` | file | Export to file |
| `memory_import` | file | Import from file |
| `memory_clear` | namespace | Clear namespace |
| `memory_optimize` | - | Optimize HNSW index |
| `memory_usage` | - | Memory usage stats |

## Monitoring Tools (~20)

| Tool | Parameters | Description |
|------|-----------|-------------|
| `performance_report` | - | Generate performance report |
| `bottleneck_analyze` | - | Find bottlenecks |
| `swarm_monitor` | interval | Real-time monitoring |
| `agent_metrics` | name | Agent-specific metrics |
| `latency_track` | - | Track response latency |
| `cost_analyze` | timeframe | Token/API cost analysis |
| `health_check` | - | System health |
| `error_report` | timeframe | Error summary |

## GitHub Tools (~30)

| Tool | Parameters | Description |
|------|-----------|-------------|
| `github_repo_analyze` | repo | Analyze repository |
| `github_pr_manage` | action, pr_id | PR operations |
| `github_issue_track` | action, issue_id | Issue operations |
| `github_sync_coord` | repos | Cross-repo sync |
| `github_metrics` | repo | Repository metrics |
| `github_pr_review` | pr_id | Automated code review |
| `github_release_create` | version, notes | Create release |
| `github_workflow_trigger` | workflow, inputs | Trigger CI/CD |

## Security Tools (~10)

| Tool | Parameters | Description |
|------|-----------|-------------|
| `aidefence_analyze` | input, level | Deep threat analysis |
| `aidefence_is_safe` | input | Quick safety check |
| `aidefence_has_pii` | input | PII detection |
| `aidefence_scan` | path | Vulnerability scan |
| `aidefence_learn` | pattern | Learn attack pattern |
| `aidefence_stats` | - | Detection statistics |
| `security_audit` | scope | Security audit |
| `security_secrets` | path | Secret detection |

## Session Tools (~10)

| Tool | Parameters | Description |
|------|-----------|-------------|
| `session_start` | name | Start session |
| `session_save` | - | Save current state |
| `session_restore` | name | Restore session |
| `session_list` | - | List sessions |
| `session_delete` | name | Delete session |
| `session_export` | file | Export session |

## Hook Tools (~15)

| Tool | Parameters | Description |
|------|-----------|-------------|
| `hooks_add` | event, handler, name | Add hook |
| `hooks_list` | - | List hooks |
| `hooks_enable` | name | Enable hook |
| `hooks_disable` | name | Disable hook |
| `hooks_remove` | name | Remove hook |
| `hooks_trigger` | event | Manual trigger |
| `hooks_status` | - | Hook statuses |

## Worker Tools (12 Specialized)

| Tool | Description |
|------|-------------|
| `worker_pattern_match` | Find similar execution patterns |
| `worker_quality_score` | Rate output quality 0-1 |
| `worker_trajectory_track` | Record execution path |
| `worker_verdict_judge` | Classify outcome |
| `worker_distill` | Extract reusable pattern |
| `worker_consolidate` | Merge to long-term memory |
| `worker_anomaly_detect` | Flag unusual patterns |
| `worker_drift_monitor` | Detect goal drift |
| `worker_cost_track` | Monitor costs |
| `worker_latency_monitor` | Track response times |
| `worker_error_classify` | Categorize failures |
| `worker_recommend` | Suggest optimizations |
