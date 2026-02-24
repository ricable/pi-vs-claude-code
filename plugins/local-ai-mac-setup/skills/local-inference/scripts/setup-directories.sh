#!/usr/bin/env bash
# setup-directories.sh - Initialize model directory structure
set -euo pipefail

info()  { printf "\033[1;34m[inference]\033[0m %s\n" "$1"; }
ok()    { printf "\033[1;32m[inference]\033[0m %s\n" "$1"; }

info "Setting up model directory structure..."

# Create LM Studio directory
mkdir -p "$HOME/.lmstudio/models/lmstudio-community"
mkdir -p "$HOME/.lmstudio/models/mlx-community"
mkdir -p "$HOME/.lmstudio/models/rano"
mkdir -p "$HOME/.lmstudio/models/ollama"
ok "LM Studio directories created"

# Create Gollama config directory
mkdir -p "$HOME/.config/gollama"
ok "Gollama config directory created"

# Create convenience symlink
if [ ! -L "$HOME/AI" ] && [ ! -d "$HOME/AI" ]; then
    ln -sf "$HOME/.lmstudio/models" "$HOME/AI"
    ok "Created convenience symlink: ~/AI -> ~/.lmstudio/models"
else
    ok "Convenience symlink already exists"
fi

# Initialize Gollama config if missing
if [ ! -f "$HOME/.config/gollama/config.json" ]; then
    cat > "$HOME/.config/gollama/config.json" <<'EOF'
{
  "ollama_api_url": "http://127.0.0.1:11434",
  "ollama_models_dir": "/Users/$(whoami)/.ollama/models",
  "lm_studio_file_paths": "/Users/$(whoami)/.lmstudio/models",
  "sort_order": "modified",
  "log_level": "info",
  "theme": "dark-neon"
}
EOF
    ok "Initialized Gollama config: ~/.config/gollama/config.json"
else
    ok "Gollama config already exists"
fi

info "Directory setup complete"
