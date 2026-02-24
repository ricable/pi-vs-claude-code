---
name: mesh-network
description: "Set up a private mesh VPN between Macs using Headscale (self-hosted control plane) and Tailscale (client). Enables remote inference access across a home lab network. Use when connecting multiple Macs for distributed inference, setting up remote access to local models, or configuring DNS/routing between machines."
---

# Headscale Mesh Network

Connect Macs in a private mesh VPN for remote inference access.

## Architecture

```
Headscale Server (Mac Studio or VPS, :8080)
    ├── MacBook (100.64.0.x) ── primary dev
    ├── Mac Studio #1 (100.64.0.y) ── worker
    └── Mac Studio #2 (100.64.0.z) ── worker
```

## Install

```bash
# Server
brew install headscale

# Client (all Macs)
brew install tailscale
```

## Server Setup (Mac Studio)

```bash
mkdir -p /opt/headscale
# Generate config (see references/mesh-config.md for full template)
headscale generate private-key | tee /opt/headscale/private.key
chmod 600 /opt/headscale/private.key
headscale serve --config=/opt/headscale/config.yaml
```

## Client Setup

```bash
# Generate pre-auth key on server
headscale pre-authenticated-keys create --user cedric --reusable --expiration 24h

# Connect client
tailscale up --login-server=http://<server-ip>:8080 --authkey=<key> --accept-routes
tailscale status
```

## Expose Inference Services

```bash
# On inference Mac, bind to all interfaces
launchctl setenv OLLAMA_HOST "0.0.0.0:11434"
llama-swap --config config/llama-swap.yaml --listen 0.0.0.0:9090
```

## Verify

```bash
# From remote Mac
curl -s http://100.64.0.y:9090/v1/models
curl -s http://100.64.0.y:11434/api/tags
ssh user@mac-studio.headscale.local
```

## Ports Reference

| Port | Service | Protocol |
|------|---------|----------|
| 8080 | Headscale control plane | HTTP |
| 3478 | DERP relay | UDP |
| 11434 | Ollama API | HTTP |
| 9090 | llama-swap | HTTP |
| 3456 | claude-code-router | HTTP |

## Bundled Resources

- **[HEADSCALE-SETUP.md](references/HEADSCALE-SETUP.md)** — Complete guide to Headscale control plane and Tailscale client setup with remote inference examples
- **mesh network skill**: `/mesh-network:setup` command for interactive setup

## Related Skills

- **local-ai-mac-setup** — Inference stack (prerequisite)
- **inference-stack** — Backend configuration
- **claude-code-router** — Route to remote models via mesh
