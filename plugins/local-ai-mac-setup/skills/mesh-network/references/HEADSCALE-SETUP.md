# Mesh Network Setup with Headscale & Tailscale

Guide for connecting multiple Macs via private VPN for distributed inference.

## Architecture

```
Mac 1 (inference server)
  ├─ Headscale (control plane)
  └─ Tailscale (client)
        ↓ VPN tunnel ↓
Mac 2 (client)
  └─ Tailscale (client)
        ↓ VPN tunnel ↓
Mac 3 (client)
  └─ Tailscale (client)

All connected via private IP addresses (100.x.x.x)
Remote inference at http://100.x.x.x:11434
```

## Prerequisites

| Item | Purpose |
|------|---------|
| Headscale binary | Control plane (installs on one Mac) |
| Tailscale clients | VPN clients (all Macs) |
| Private domain | DNS for control plane (optional but recommended) |
| Public IP / DynDNS | For external control plane (optional) |

## Step 1: Install Headscale (Control Plane)

On the Mac that will be the "server":

```bash
# Install via Homebrew
brew install headscale

# Or via mise
mise use headscale@latest

# Verify
headscale version
```

## Step 2: Configure Headscale

Create `~/.config/headscale/config.yaml`:

```yaml
server_url: http://100.100.100.1:8080
listen_addr: 0.0.0.0:8080
metrics_listen_addr: 0.0.0.0:9090
db_type: sqlite3
db_path: /Users/you/.local/share/headscale/db.sqlite

# Namespaces (teams)
namespaces:
  - name: ai-home

# Allow routes (private IPs)
routes:
  - route: 100.64.0.0/10
    enabled: true

# Authentication
disable_check_updates: true

acl_policy_path: /Users/you/.config/headscale/acl.yaml
```

Create ACL file `~/.config/headscale/acl.yaml`:

```yaml
# Allow all traffic within namespace
rules:
  - action: accept
    src:
      - namespace: ai-home
    dst:
      - namespace: ai-home
        ports:
          - 1:65535

# Allow inference traffic
  - action: accept
    src:
      - namespace: ai-home
    dst:
      - namespace: ai-home
        ports:
          - "11434:11434"  # Ollama
          - "9090:9090"    # llama-swap
```

## Step 3: Start Headscale

```bash
# Start control plane
headscale serve &

# Verify it's listening
curl -s http://localhost:8080/health || echo "Not ready"
```

## Step 4: Create Namespace & Pre-auth Keys

Generate pre-auth keys for clients to join:

```bash
# List namespaces
headscale namespaces list

# Create namespace if needed
headscale namespaces create ai-home

# Generate pre-auth key (1 hour expiry)
headscale pre-auth-keys create \
  --namespace ai-home \
  --expiration 1h \
  --reusable

# View generated key
headscale pre-auth-keys list --namespace ai-home
```

## Step 5: Join Clients via Tailscale

On each client Mac:

```bash
# 1. Install Tailscale
brew install tailscale

# 2. Start Tailscale daemon
sudo tailscaled -tun=utun &

# 3. Login (use Headscale control plane)
sudo tailscale up \
  --login-server=http://100.100.100.1:8080 \
  --authkey=<pre-auth-key-from-step-4> \
  --advertise-routes=0.0.0.0/0 \
  --accept-routes

# 4. Verify connection
tailscale status

# Shows:
# 100.100.100.1 headscale DERP, DIRECT
# 100.100.100.2 mac-client DIRCT
```

## Step 6: Test Connectivity

From any client, ping the server:

```bash
# Ping Headscale server
ping 100.100.100.1

# Verify DNS resolution
nslookup ai-home.internal

# Access Ollama on server
curl -s http://100.100.100.1:11434/api/tags | jq .
```

## Step 7: Remote Inference

Configure local inference tools to use remote models:

### Ollama (remote)

```bash
# Create Modelfile pointing to remote Ollama
cat > /tmp/RemoteModelfile <<'EOF'
FROM http://100.100.100.1:11434/api/models/glm-4.7-flash
PARAMETER num_ctx 32768
EOF

# Create model pointing to remote
ollama create glm-remote -f /tmp/RemoteModelfile

# Use remote model
ollama run glm-remote "Hello"
```

### RANO via llama-swap (remote)

```bash
# Configure RANO to use remote llama-swap
export RANO_LM_BACKEND=llamaswap
export RANO_LM_STUDIO_URL=http://100.100.100.1:9090

# Run RANO optimizer (uses remote models)
cd .claude/skills/elex-ran-features/optimizer/ts
npx tsx run-catalog.ts
```

### Claude Code Router (remote)

Configure CCR to route to remote Ollama:

```json
{
  "providers": [
    {
      "name": "remote-ollama",
      "api_base_url": "http://100.100.100.1:11434/v1/chat/completions",
      "models": ["glm-4.7-flash"]
    }
  ],
  "Router": {
    "default": "remote-ollama,glm-4.7-flash"
  }
}
```

## Monitoring

### Headscale Metrics

```bash
# Health check
curl -s http://localhost:8080/health | jq .

# Metrics (Prometheus format)
curl -s http://localhost:9090/metrics | head -20
```

### Connected Clients

```bash
# List all nodes
headscale nodes list

# View node details
headscale nodes list -n ai-home

# Get IP address
headscale nodes list -o json | jq '.[] | {name, ip}'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Clients can't connect | Check `login-server` URL matches Headscale endpoint |
| Slow tunneling | Check network latency: `ping 100.100.100.1` |
| Routes not working | Verify ACL rules allow traffic, check `advertise-routes` |
| DNS resolution fails | Ensure all clients have Headscale DNS configured |
| Headscale won't start | Check port 8080 is free: `lsof -i :8080` |

## Advanced: Self-Hosted Domain

For external access, use a custom domain:

```yaml
# In Headscale config
server_url: https://mesh.example.com:8443
listen_addr: 0.0.0.0:8443
tls_cert_path: /path/to/cert.pem
tls_key_path: /path/to/key.pem
```

Then clients login with:

```bash
sudo tailscale up \
  --login-server=https://mesh.example.com:8443 \
  --authkey=<pre-auth-key>
```

## Best Practices

1. **Use pre-auth keys** — Secure, short-lived access tokens
2. **Monitor metrics** — Watch latency and packet loss
3. **Plan IP ranges** — Use 100.x.x.x for predictable addressing
4. **Backup database** — Regularly backup `~/.local/share/headscale/db.sqlite`
5. **Update regularly** — `brew upgrade headscale tailscale`
6. **Test failover** — Verify clients reconnect if server goes down
7. **Document topology** — Keep notes on which Mac is the server

## Related Skills

- **local-ai-mac-setup** — Inference stack
- **inference-stack** — Backend setup
- **model-management** — Model organization
- **claude-code-router** — Route to remote models
