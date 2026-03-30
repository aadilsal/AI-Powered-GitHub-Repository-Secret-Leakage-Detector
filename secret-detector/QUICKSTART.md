# 🚀 Quick Start Guide - Secret Leakage Detector

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git installed on your system

## Installation

```bash
cd secret-detector
npm install
```

## Running the Application

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

## Async scan jobs (enterprise mode)

For production-like behavior (non-blocking scans), run Redis + the worker.

### Option A: Docker (recommended)

From repo root:

```bash
docker compose up --build
```

### Option B: Local processes

1) Start Redis
2) Start the ML backend (`ml-backend/`)
3) Start the worker:

```bash
cd secret-detector
export REDIS_URL="redis://127.0.0.1:6379"
npm run worker:scan
```

4) Create a scan:

```bash
curl -X POST http://localhost:3000/api/scans \
  -H "Content-Type: application/json" \
  -d '{"kind":"url","repoUrl":"https://github.com/octocat/Hello-World"}'
```

## Usage

### Method 1: Scan a GitHub Repository

1. Open http://localhost:3000
2. Click the **"Scan Repository URL"** tab
3. Enter a repository URL:
   - Example: `https://github.com/octocat/Hello-World`
   - Supports: GitHub, GitLab, Bitbucket
4. Click **"Scan Repository"**
5. Wait for the scan to complete
6. View the results showing:
   - Number of files scanned
   - Potential secrets detected
   - File paths and line numbers
   - Code snippets with secrets

### Method 2: Upload a ZIP File

1. Open http://localhost:3000
2. Click the **"Upload ZIP File"** tab
3. Click **"Choose File"** and select a ZIP file containing code
4. Click **"Scan ZIP File"**
5. Wait for the scan to complete
6. View the results

## What Gets Detected?

The scanner looks for potential secrets using:

### Keywords
- `password`, `passwd`, `pwd`
- `secret`, `token`
- `api_key`, `apikey`
- `access_key`, `private_key`
- `auth`, `credentials`, `key`

### Conditions
- Length > 20 characters
- High entropy (Shannon entropy > 3.5)

### Example Detections
```javascript
// ✗ Will be detected
const apiKey = "sk_test_EXAMPLE1234567890abcdefghijk";
const password = "MyS3cr3tP@ssw0rd!123456";
const token = "ghp_EXAMPLE1234567890abcdefghijklmnopqrst";

// ✓ Will NOT be detected (too short or low entropy)
const password = "test123";
const key = "simple";
```

## Folder Structure

```
secret-detector/
├── app/
│   ├── api/
│   │   ├── scan-url/      # Repository scanning endpoint
│   │   └── scan-upload/   # ZIP upload endpoint
│   └── page.tsx           # Main UI
├── lib/
│   ├── cloneRepo.ts       # Git cloning
│   ├── extractZip.ts      # ZIP extraction
│   ├── walkFiles.ts       # File walking
│   └── detectCandidates.ts # Secret detection
└── types/
    └── index.ts           # TypeScript types
```

## API Endpoints

### POST /api/scan-url
```bash
curl -X POST http://localhost:3000/api/scan-url \
  -H "Content-Type: application/json" \
  -d '{"repoUrl":"https://github.com/username/repo"}'
```

### POST /api/scans (async)
```bash
curl -X POST http://localhost:3000/api/scans \
  -H "Content-Type: application/json" \
  -d '{"kind":"url","repoUrl":"https://github.com/username/repo"}'
```

### GET /api/scans/:scanId
```bash
curl http://localhost:3000/api/scans/<scanId>
```

### POST /api/scan-upload
```bash
curl -X POST http://localhost:3000/api/scan-upload \
  -F "file=@path/to/your/file.zip"
```

## Troubleshooting

### "Failed to clone repository"
- Check if the repository URL is correct
- Ensure the repository is public
- Check your internet connection
- Verify Git is installed: `git --version`

### "Failed to extract ZIP"
- Ensure the file is a valid ZIP archive
- Check file size (very large files may timeout)
- Try a different ZIP file

### Port 3000 already in use
```bash
# Use a different port
PORT=3001 npm run dev
```

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## What's Next? (Day 2+)

- Machine Learning-based detection
- Regex pattern matching
- Advanced entropy analysis
- Confidence scoring
- Database integration
- Enhanced UI with filtering
- Export functionality (PDF, CSV)
- Historical scan tracking

## Support

For issues or questions:
1. Check the README.md
2. Review DAY1-SUMMARY.md
3. See TEST.md for API testing examples

---

**Happy Scanning! 🔐**
