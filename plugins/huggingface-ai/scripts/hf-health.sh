#!/usr/bin/env bash
# HuggingFace ecosystem health check
set -euo pipefail

PASS="\033[32mPASS\033[0m"
FAIL="\033[31mFAIL\033[0m"
WARN="\033[33mWARN\033[0m"
INFO="\033[34mINFO\033[0m"

echo "==============================="
echo "HuggingFace Ecosystem Health"
echo "==============================="
echo ""

# 1. HF CLI installed
printf "%-20s" "HF CLI"
if command -v hf &>/dev/null; then
    version=$(hf version 2>/dev/null || hf --version 2>/dev/null || echo "unknown")
    printf "$PASS  %s\n" "$version"
else
    printf "$FAIL  Not installed. Run: uv tool install huggingface_hub[cli]\n"
fi

# 2. Auth status
printf "%-20s" "Auth"
if hf auth whoami &>/dev/null; then
    user=$(hf auth whoami 2>/dev/null | head -1)
    printf "$PASS  %s\n" "$user"
else
    printf "$FAIL  Not logged in. Run: hf auth login\n"
fi

# 3. HF_TOKEN env var
printf "%-20s" "HF_TOKEN"
if [ -n "${HF_TOKEN:-}" ]; then
    token_preview="${HF_TOKEN:0:6}...${HF_TOKEN: -4}"
    printf "$PASS  Set (%s)\n" "$token_preview"
else
    printf "$WARN  Not set. Jobs need: export HF_TOKEN=\$(hf auth token)\n"
fi

# 4. Python
printf "%-20s" "Python"
if command -v python3 &>/dev/null; then
    py_version=$(python3 --version 2>/dev/null)
    printf "$PASS  %s\n" "$py_version"
else
    printf "$FAIL  Not found\n"
fi

# 5. uv
printf "%-20s" "uv"
if command -v uv &>/dev/null; then
    uv_version=$(uv --version 2>/dev/null)
    printf "$PASS  %s\n" "$uv_version"
else
    printf "$WARN  Not installed. Run: curl -LsSf https://astral.sh/uv/install.sh | sh\n"
fi

# 6. TrackIO CLI
printf "%-20s" "TrackIO"
if command -v trackio &>/dev/null; then
    printf "$PASS  Available\n"
elif python3 -c "import trackio" 2>/dev/null; then
    printf "$PASS  Python module available\n"
else
    printf "$WARN  Not installed. Run: pip install trackio\n"
fi

# 7. Running jobs
printf "%-20s" "Running Jobs"
if command -v hf &>/dev/null && hf auth whoami &>/dev/null; then
    jobs_output=$(hf jobs ps 2>/dev/null || echo "")
    if [ -n "$jobs_output" ]; then
        job_count=$(echo "$jobs_output" | grep -c "RUNNING\|PENDING" 2>/dev/null || echo "0")
        printf "$INFO  %s active\n" "$job_count"
    else
        printf "$INFO  No jobs found\n"
    fi
else
    printf "$WARN  Cannot check (not authenticated)\n"
fi

# 8. Cache size
printf "%-20s" "Cache"
if command -v hf &>/dev/null; then
    cache_output=$(hf cache ls 2>/dev/null | tail -1 || echo "")
    if [ -n "$cache_output" ]; then
        printf "$INFO  %s\n" "$cache_output"
    else
        printf "$INFO  Empty or inaccessible\n"
    fi
else
    printf "$WARN  Cannot check (hf CLI not installed)\n"
fi

echo ""
echo "==============================="
echo "Health check complete."
