---
name: local-ai-mac-setup
description: Complete Apple Silicon local AI setup plugin for inference backends, routing, provider mirroring, and optimization workflows.
---

# Local AI Mac Setup Plugin

Unified entry point for local AI development on macOS with Apple Silicon.

## Skill Routing

| Task | Sub-Skill | Purpose |
|------|-----------|---------|
| Configure provider mirrors | `cc-mirror-providers` | Multi-provider mirror setup |
| Integrate Claude Agent SDK | `claude-agent-sdk` | SDK patterns and bootstrap |
| Configure Claude Code | `claude-code-config` | Hook and config setup |
| Route requests across providers | `claude-code-router` | Routing strategy and load balancing |
| Full machine provisioning | `full-setup` | End-to-end setup orchestration |
| Secure mesh connectivity | `mesh-network` | Headscale/Tailscale mesh setup |
| Manage toolchain | `mise-toolchain` | mise bootstrap and validation |
| Manage local models | `model-management` | Download/audit/share models |
| Enable local inference | `local-inference` | Ollama/LM Studio/llama.cpp stack |
| Validate inference stack | `inference-stack` | Backend installation and verification |
| Optimize for RANO workloads | `rano-optimizer` | Performance tuning and profiling |

## Commands

| Command | Description |
|---------|-------------|
| `setup` | Provision and configure local stack |
| `providers` | Configure mirror providers |
| `status` | Check system and backend status |

## Key Capabilities

- Apple Silicon-native local inference workflows
- Multi-provider routing and failover strategies
- Mesh networking for distributed local agent setups
- Toolchain reproducibility with mise
- Local model lifecycle management and optimization

## References

- `references/provider-matrix.md`
- `references/model-matrix.md`
- `references/ccr-configs.md`
- `references/troubleshooting.md`

