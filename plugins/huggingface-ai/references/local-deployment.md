# Local Deployment: HF to Apple Silicon

Full pipeline from HuggingFace training to local serving.

## GGUF Conversion

Three methods to get a GGUF file from a trained model.

### Option 1: llama.cpp (Most Control)

Run as an HF Job to avoid local setup:
```python
hf_jobs("uv", {
    "script": """
# /// script
# dependencies = ["huggingface_hub", "torch", "transformers"]
# ///
import subprocess, os
from huggingface_hub import snapshot_download, HfApi

model_id = os.environ["MODEL_ID"]
output_repo = os.environ["OUTPUT_REPO"]
quant = os.environ.get("QUANT", "Q4_K_M")

# Download model
model_path = snapshot_download(model_id)

# Clone llama.cpp and build
subprocess.run(["git", "clone", "https://github.com/ggerganov/llama.cpp"], check=True)
subprocess.run(["make", "-C", "llama.cpp", "-j"], check=True)

# Convert to GGUF
subprocess.run(["python", "llama.cpp/convert_hf_to_gguf.py", model_path,
    "--outfile", "model-f16.gguf", "--outtype", "f16"], check=True)

# Quantize
subprocess.run(["llama.cpp/llama-quantize", "model-f16.gguf",
    f"model-{quant}.gguf", quant], check=True)

# Upload
api = HfApi()
api.create_repo(output_repo, exist_ok=True)
api.upload_file(path_or_fileobj=f"model-{quant}.gguf",
    path_in_repo=f"model-{quant}.gguf", repo_id=output_repo)
""",
    "flavor": "a10g-large",
    "timeout": "45m",
    "secrets": {"HF_TOKEN": "$HF_TOKEN"},
    "env": {
        "MODEL_ID": "username/my-model",
        "OUTPUT_REPO": "username/my-model-gguf",
        "QUANT": "Q4_K_M"
    }
})
```

### Option 2: Unsloth (Fastest, Auto-Merged LoRA)

If trained with Unsloth, conversion is built in:
```python
model.save_pretrained_gguf("model-gguf", tokenizer, quantization_method="q4_k_m")
model.push_to_hub_gguf("username/my-model-gguf", tokenizer, quantization_method="q4_k_m")
```

### Option 3: Download Pre-Quantized

Many popular models have community GGUF uploads:
```bash
hf download bartowski/Qwen2.5-7B-Instruct-GGUF --include "*Q4_K_M*" --local-dir ./models
```

## Register with Ollama

### Create Modelfile

```Dockerfile
FROM ./model-Q4_K_M.gguf

TEMPLATE """{{- if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}<|im_start|>user
{{ .Prompt }}<|im_end|>
<|im_start|>assistant
"""

PARAMETER stop "<|im_end|>"
PARAMETER temperature 0.7
PARAMETER num_ctx 4096
```

### Register and Serve

```bash
# Create the model
ollama create my-model -f Modelfile

# Test
ollama run my-model "Hello, how are you?"

# List models
ollama list
```

## Register with llama-swap

llama-swap manages multiple models behind a single API endpoint.

### Add to Config

Add to your `config.yaml`:
```yaml
models:
  my-model:
    cmd: >-
      llama-server
      --model ./models/model-Q4_K_M.gguf
      --port 9101
      --ctx-size 4096
      --n-gpu-layers 99
    proxy: "http://127.0.0.1:9101"
    ttl: 300
    aliases:
      - "my-finetuned"
```

### Reload

```bash
curl -X POST http://localhost:8080/upstream/reload
```

## Register with LM Studio

### Place GGUF File

LM Studio looks for models in `~/.cache/lm-studio/models/`:
```bash
# Create model directory
mkdir -p ~/.cache/lm-studio/models/username/my-model-gguf

# Copy or symlink GGUF
cp model-Q4_K_M.gguf ~/.cache/lm-studio/models/username/my-model-gguf/

# Or symlink from your download location
ln -sf /path/to/model-Q4_K_M.gguf ~/.cache/lm-studio/models/username/my-model-gguf/
```

### Load in LM Studio

1. Open LM Studio
2. Navigate to "My Models" tab
3. Select the model
4. Click "Load" and configure context length, GPU layers

## Full Pipeline: Train -> Convert -> Serve

```bash
# 1. Train on HF Jobs (see train command)
#    Result: username/my-model on Hub

# 2. Convert to GGUF on HF Jobs (see Option 1 above)
#    Result: username/my-model-gguf on Hub

# 3. Download GGUF locally
hf download username/my-model-gguf --include "*Q4_K_M*" --local-dir ./models

# 4. Register with Ollama
cat > Modelfile << 'EOF'
FROM ./models/model-Q4_K_M.gguf
TEMPLATE """{{- if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}<|im_start|>user
{{ .Prompt }}<|im_end|>
<|im_start|>assistant
"""
PARAMETER stop "<|im_end|>"
EOF

ollama create my-model -f Modelfile

# 5. Serve
ollama run my-model "Test the fine-tuned model"
```

## See Also

- `hugging-face-model-trainer/references/gguf_conversion.md` for detailed conversion docs
- `local-ai-mac-setup` plugin for comprehensive local inference setup
- `hardware-guide.md` for Apple Silicon quant recommendations
