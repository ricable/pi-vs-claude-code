# RANO Optimizer Architecture

Complete guide to the RAN optimization pipeline with 52 intents, 8-stage GEPA processing, and 21 domain expert agents.

## System Overview

```
User Intent (e.g., "Beam failure in 5G NR")
    ↓
Stage 0: Enrichment (DSPy GEPA)
    ↓ enriched intent with context, metrics, goals
RANO Optimizer (52 intents → 8 stages)
    ├─ Stage 1: Intent classification (neural)
    ├─ Stage 2: KPI prediction (neural)
    ├─ Stage 3: Root cause analysis
    ├─ Stage 4: Solution ranking
    ├─ Stage 5: Impact assessment
    ├─ Stage 6: Anomaly scoring (neural)
    ├─ Stage 7: Execution planning
    └─ Stage 8: Result validation

    ↓ Route to domain expert agent pool
21 Fine-Tuned Domain Experts
    └─ Each handles specific RAN domain
        └─ 4g-lte, 5g-nr, admission, alarm, antenna, beam,
           ca, capacity, coverage, energy, enm-api, interference,
           learning, link-adaptation, loadbalance, mobility, neighbor,
           power, resilience, rrm, throughput

    ↓ Query local inference
Ollama GLM / LM Studio / llama-swap
    ↓ Response
```

## 52 Intents

Core intents handled by RANO with enriched versions:

| Domain | Intent Count | Examples |
|--------|--|--|
| **4G LTE** | 5 | IFLB, RRC, load-balancing, TTI bundling, cell-edge |
| **5G NR** | 6 | Beam management, MCS, scheduling, slot format, CSI-RS |
| **Admission Control** | 4 | CAC, VoLTE, IMS, emergency services |
| **Alarms** | 3 | Fault detection, threshold tuning, correlation |
| **Antenna/RF** | 4 | Antenna gain, tilt, transmit power, interference |
| **Capacity** | 5 | Cell throughput, scheduler tuning, QoS, MIMO |
| **Coverage** | 4 | Hole identification, pilot power, antenna adjustment |
| **Energy** | 3 | Power consumption, idle periods, sleep modes |
| **Interference** | 3 | Mitigation strategies, coordination, ICC |
| **Mobility** | 4 | Handover, cell reselection, speed-dependent policies |
| ... | ... | ... |

Complete list: `.claude/skills/elex-ran-features/optimizer/ts/catalog.ts`

## 8-Stage GEPA Pipeline

**Stage 0: Enrichment** (DSPy GEPA enrichment module)
- Adds context: metrics, KPIs, historical patterns
- Generates gold-standard enriched versions
- Input: raw intent, Output: enriched intent with context

**Stage 1: Intent Classification** (Neural)
- Classifier network: determines domain (4G, 5G, Capacity, etc.)
- Routes to appropriate domain agent
- Input: enriched intent, Output: classification + confidence

**Stage 2: KPI Prediction** (Neural)
- FANN neural forecaster: predicts relevant KPIs
- E.g., "beam failure" → predicts SINR drop, throughput impact
- Input: enriched intent + metrics, Output: KPI deltas

**Stage 3: Root Cause Analysis**
- LLM analyzes why intent occurred
- Examines: config, traffic, RF conditions, recent changes
- Output: root cause hypothesis + confidence

**Stage 4: Solution Ranking**
- LLM ranks candidate solutions by effectiveness
- Considers: implementation complexity, risk, timeline
- Output: ranked solutions with rationale

**Stage 5: Impact Assessment**
- LLM predicts impact of each solution
- Examines: side effects, dependencies, rollback plan
- Output: impact matrix

**Stage 6: Anomaly Scoring** (Neural)
- FANN anomaly detector: identifies unusual patterns
- Flags risky solutions or missing context
- Input: intent + solutions, Output: anomaly score

**Stage 7: Execution Planning**
- LLM generates detailed execution plan
- Includes: steps, rollback procedures, monitoring
- Output: playbook

**Stage 8: Validation**
- LLM validates feasibility and consistency
- Cross-checks with domain knowledge
- Output: validation report + approval recommendation

## Backend Routing

Three backends supported with automatic failover:

### Primary: LM Studio (GUI + parallel)

```bash
lms server start          # GUI at http://localhost:1234
cd .claude/skills/elex-ran-features/optimizer/ts
npx tsx run-catalog.ts   # Queries LM Studio
```

### Recommended: llama-swap (Single proxy)

```bash
# llama-swap routes to llama-server by model name
llama-swap --config config/llama-swap.yaml --listen 0.0.0.0:9090

export RANO_LM_BACKEND=llamaswap
npx tsx run-catalog.ts
```

### Legacy: Ollama (Multi-port fleet)

```bash
ollama serve

export RANO_LM_BACKEND=legacy
npx tsx run-catalog.ts    # Uses per-agent ports (11435-11455)
```

### Routing Cascade

1. **LM Studio** (if available) → fastest, most responsive
2. **llama-swap** (if running) → single endpoint, easy
3. **Ollama GLM** (if running) → fallback, automatic

## Domain Expert Agents (21 agents)

Each agent is a fine-tuned Qwen3-0.6B GGUF model (484 MB each):

| Port | Domain | Responsibility |
|------|--------|---|
| 11435 | 4g-lte | 4G LTE-specific intents |
| 11436 | 5g-nr | 5G NR beam, MCS, scheduling |
| 11437 | admission | CAC, VoLTE, emergency |
| 11438 | alarm | Fault detection, correlation |
| 11439 | antenna | Antenna gain, tilt, power |
| 11440 | beam | Beam management, PMI |
| ... | ... | ... |
| 11455 | throughput | Cell throughput optimization |

Full port map in `config.ts`

## Environment Variables

Control RANO behavior:

```bash
export RANO_LM_BACKEND=llamaswap      # Backend: legacy, lmstudio, llamaswap
export RANO_LM_STUDIO_URL=http://localhost:1234  # LM Studio endpoint
export RANO_INTENT_CONCURRENCY=8      # Parallel processing (auto = CPU count)
export RANO_FINE_TUNED=false          # Use fine-tuned models (true when available)
export RANO_ENRICHMENT_BUDGET=heavy   # DSPy GEPA budget: light, medium, heavy
export RANO_LOG_LEVEL=info            # Logging: debug, info, warn, error
```

## Configuration Files

Key files in `.claude/skills/elex-ran-features/optimizer/ts/`:

```
config.ts                    Backend config, ports, concurrency
catalog.ts                   52 intents definition
enrichment-module.ts         Stage 0 enrichment pipeline
plan.ts                      Stages 3-8 planning
neural-models/               FANN neural models
  ├─ intent-classifier.fann
  ├─ kpi-forecaster.fann
  └─ anomaly-scorer.fann
```

## Performance Metrics

Benchmark on M3 Max 128GB:

| Metric | Value | Notes |
|--------|-------|-------|
| Intent processing | ~2-5s | Stages 1-2 (neural) |
| Root cause analysis | ~3-8s | Stage 3 (LLM) |
| Full pipeline | ~15-25s | Stages 0-8 complete |
| Throughput | ~5-10 intents/min | Concurrent processing |
| Cost | $0 | All local, no API calls |

## Example: Beam Failure Intent

```
User: "Beam failure degrading 5G NR throughput"
  ↓
Stage 0 (Enrichment):
  Intent enriched with: SINR values, rank metrics, PMI history
  → enriched_intent
  ↓
Stage 1 (Classification):
  neural: Intent → beam domain (confidence: 98%)
  ↓
Stage 2 (KPI Prediction):
  neural: SINR drop, rank loss → throughput impact -15%
  ↓
Stage 3 (Root Cause):
  LLM: "RF interference from neighbor cell + antenna misalignment"
  ↓
Stage 4 (Solutions):
  LLM: [antenna tilt up, ICC enable, beam refinement]
  ↓
Stage 5 (Impact):
  LLM: Tilt up → +5% throughput, 2% other cell impact
  ↓
Stage 6 (Anomaly):
  neural: Low anomaly score (expected pattern)
  ↓
Stage 7 (Playbook):
  LLM: Step-by-step procedure, rollback plan
  ↓
Stage 8 (Validation):
  LLM: "Feasible, low risk, high impact" → APPROVED
```

## Enrichment Pipeline (Stage 0)

DSPy GEPA enrichment adds context to raw intents:

```bash
# Compile enrichment module (requires Ollama)
npx tsx scripts/compile-enrichment.ts --budget heavy

# Output: enriched catalog with 52 × 2 versions (raw + enriched)
```

Enrichment files:
- `enrichment-types.ts` — Context types (metrics, KPIs, goals)
- `enrichment-signatures.ts` — DSPy module signatures
- `enrichment-module.ts` — GEPA enrichment logic
- `enrich.ts` — Orchestration

## Model Training

Fine-tune agents for specific domains:

```bash
# Setup
source .venv-training/bin/activate
source .env.training

# Generate training datasets (6-step pipeline)
just datasets

# Train single agent
just train 4g-lte

# Train all 21 agents
just train-all

# Convert to GGUF
just convert-gguf

# Serve locally
just lms-start && just lms-register

# Validate
just stress-test
```

See `FINE-TUNING-GUIDE.md` for complete training documentation.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Model not found" | Download models via LM Studio or `lms get` |
| "Port in use" | Check `lsof -i :9090` for llama-swap, check `11435-11455` for legacy |
| Slow responses | Increase `RANO_INTENT_CONCURRENCY`, use faster backend |
| OOM during training | Reduce batch size in `config.ts`, check memory budget |
| Enrichment errors | Check Ollama is running, models are loaded |

## References

- Intent catalog: `.claude/skills/elex-ran-features/optimizer/ts/catalog.ts`
- Fine-tuning: `FINE-TUNING-GUIDE.md`
- Neural models: `ruv-fann` skill
- GEPA enrichment: `dspy-ts` pattern
