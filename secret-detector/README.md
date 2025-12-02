# Secret Detector — AI-powered Repository Secret Leakage Detector

Professional, open-source tool to detect potential secret leaks (API keys, tokens, credentials) in code repositories using a hybrid of regex/entropy heuristics and ML inference. The project combines a Next.js dashboard, server-side scanning APIs, a lightweight Python ML server, and utilities for cloning, walking, and analyzing repository content.

---

**Table of contents**

- Project description
- Core features
- Dataset (training) explanation
- ML model architecture
- Installation
- How scanning works
- How scoring works
- API documentation
- UI screenshots (placeholders)
- Security considerations
- Limitations
- Future work

---

## Project description

This repository provides an automated scanner that finds potential secrets leaked inside source code. It uses deterministic detections (regular expressions and entropy heuristics) to propose candidate strings and a small ML model to reduce false positives. The UI helps security reviewers triage, filter, and export reports.

Key components:
- `app/` — Next.js frontend pages and API routes
- `lib/` — scanning helpers: cloning, walking files, regex classification, entropy calculation, ML client, and scoring
- `ml-backend/` — Python FastAPI ML server, feature extractor and model loader

## Core features

- Repo scanning by Git URL (`/api/scan-url`) and ZIP upload (`/api/scan-upload`)
- Regex-based detection using curated patterns
- Entropy-based heuristics to surface high-entropy tokens
- ML inference via local Python service to improve precision
- Hybrid scoring that combines heuristics and ML confidence
- Interactive Next.js dashboard with filtering, charts, and export (JSON/PDF)

## Dataset (training) explanation

The ML model used by the project was trained on curated, labeled examples of token-like strings: a mixture of anonymized real leaks, synthetic tokens, and non-secret examples (to reduce bias). The repository doesn't embed raw training datasets for privacy reasons. Instead, the ML server expects a joblib-serialised scikit-learn compatible model at the repo root named `secret_detector_model.pkl`.

If you plan to retrain:
- Prepare a CSV/TSV of labeled examples (string, label)
- Use the `ml-backend/feature_extractor.py` to compute features for training
- Train a scikit-learn classifier (e.g., RandomForest, LogisticRegression, XGBoost)
- Export with `joblib.dump(model, 'secret_detector_model.pkl')`

## ML model architecture

- Feature extractor: `ml-backend/feature_extractor.py`
  - computes token-level features: length, character diversity, digit/upper/lower/symbol ratios, Shannon entropy, and regex-based flags (e.g., AWS key, GitHub PAT, JWT)
- Model: scikit-learn compatible classifier (serialised with `joblib`) loaded by `ml-backend/model_loader.py`
- Serving: `ml-backend/main.py` exposes a FastAPI endpoint `POST /predict` which accepts JSON `{ "text": "..." }` and returns `{ prediction, confidence, features }`

Notes: the repository ships the feature extractor and loading code — the exact classifier type (RandomForest/LogisticRegression/etc.) is chosen by the trainer and saved into `secret_detector_model.pkl`.

## Installation

Prerequisites:
- Node.js (16+ recommended)
- npm or yarn
- Python 3.10+ (for ML backend)

1) Frontend / API (Next.js)

PowerShell example:

```powershell
# from repo root
cd "D:/Aadil Laptop/FAST/Semester 7/Infomation Security/Project/secret-detector"
npm install
npm run dev
```

The Next.js app runs on the configured port (by default `3000`). API routes are server-side functions (see `app/api/`).

2) Python ML server

PowerShell example:

```powershell
cd "D:/Aadil Laptop/FAST/Semester 7/Infomation Security/Project/secret-detector/ml-backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install fastapi uvicorn joblib scikit-learn numpy
# Ensure you have a model at repo root named: secret_detector_model.pkl
python main.py
```

The ML server listens at `http://127.0.0.1:8000` and exposes `/predict`.

3) Optional: running in production

- Build the Next.js app and deploy to a Node hosting provider. Ensure the ML server is reachable from the Node host (or deploy ML as a separate service behind a secure internal network).

## How scanning works

High-level flow:

1. API receives scan request (Git URL or uploaded ZIP). See `app/api/scan-url/route.ts` and `app/api/scan-upload/route.ts`.
2. If URL, repository is cloned into a temporary workspace (`lib/cloneRepo.ts`). If ZIP, it is extracted (`lib/extractZip.ts`).
3. `lib/walkFiles.ts` enumerates files with text/binary filtering and basic sampling rules.
4. For each candidate file, `lib/detectCandidates.ts` scans line-by-line:
   - Run regex classification (`lib/classifyByRegex.ts`) to find strong pattern matches (AWS keys, GitHub PATs, JWTs, etc.)
   - Calculate entropy for matched tokens or extracted values (`lib/entropy.ts` / `ml-backend/feature_extractor.py`)
   - For matched or heuristic candidates, call ML client `lib/mlClient.ts` which queries the ML server `/predict` for probability/confidence
   - Merge signals and compute a hybrid score (`lib/scoreSecret.ts`)
5. Results are returned as structured JSON (see `types/ScanTypes.ts`) and can be rendered by the UI or exported.

## How scoring works

- The hybrid scoring logic lives in `lib/scoreSecret.ts`. It combines ML confidence with deterministic boosts:
  - ML confidence forms the base score (0..1)
  - +0.35 added if a regex match exists (conservative boost)
  - +0.18 if entropy > 4.5, +0.09 if entropy > 3.5
  - Final score is clamped to 0..1
  - Severity thresholds: >= 0.85 -> HIGH, >= 0.55 -> MEDIUM, else LOW

This approach improves recall on obvious matches while relying on ML to filter noisy heuristics.

## API documentation

All API endpoints are server-side routes inside `app/api/`.

- POST `/api/scan-url` — body: `{ "repoUrl": "https://github.com/owner/repo" }` — clones the repo and returns scan results JSON.
- POST `/api/scan-upload` — multipart form-data with key `file` (ZIP) — extracts and scans the ZIP; returns results JSON.
- POST `/api/generate-report` — accepts JSON body `{ data, format?: 'json'|'pdf' }` and returns a downloadable JSON or PDF (PDF generator uses `scripts/generate-pdf.js`).
- POST `/api/download-report` — returns a JSON blob suitable for direct download.

ML server (separate):
- POST `http://127.0.0.1:8000/predict` — body: `{ "text": "..." }` — response: `{ "prediction": int, "confidence": float, "features": [...] }`.

Response schema (scan result):
- `repo`: origin (URL or filename)
- `totalFiles`: enumerated file count
- `totalFindings`: number of candidate findings
- `findings`: array of findings with fields: `filePath`, `lineNumber`, `content` (masked), `entropy`, `regexMatch`, `secretType`, `mlConfidence`, `hybridScore`, `severity`

## Security considerations

- The scanner may process sensitive data — treat all clones and extracts as untrusted and run on isolated infrastructure.
- Do not run this scanner with elevated privileges on production machines.
- ML model and logs may contain sensitive patterns; rotate and protect any stored model files and logs.
- When exposing the ML endpoint, secure it behind network controls or TLS and authentication if deployed publicly.
- The UI masks secrets in results — however, care should be taken when storing or exporting reports.

## Limitations

- Heuristics can produce false positives (random high-entropy strings) and false negatives (secrets broken across lines or split into parts)
- The ML model depends on the training data quality and may not generalize to novel token formats.
- Binary files and very large files are skipped or sampled — some secrets may be missed.

**Built with ❤️ for Information Security Project**

