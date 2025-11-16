# AI-Powered GitHub Repository Secret Leakage Detector

## Day 1: Base Project Structure + Repo Cloning + File Walking + Stub Scanner

### 🚀 Project Overview

A Next.js 14 application that scans GitHub repositories and ZIP files for potential secret leakages using entropy-based detection and keyword matching.

### 📦 Technologies Used

- **Next.js 14** with App Router
- **TypeScript**
- **TailwindCSS**
- **simple-git** - Git repository cloning
- **adm-zip** - ZIP file extraction

### 🏗️ Project Structure

```
secret-detector/
├── app/
│   ├── api/
│   │   ├── scan-url/
│   │   │   └── route.ts          # API endpoint for repository URL scanning
│   │   └── scan-upload/
│   │       └── route.ts          # API endpoint for ZIP file upload scanning
│   └── page.tsx                  # Main frontend UI
├── lib/
│   ├── cloneRepo.ts              # Repository cloning utility
│   ├── extractZip.ts             # ZIP extraction utility
│   ├── walkFiles.ts              # Recursive file walker
│   └── detectCandidates.ts       # Secret candidate detection logic
├── types/
│   └── index.ts                  # TypeScript interfaces
└── tmp/                          # Temporary directory for clones/uploads
    ├── scanner/                  # Cloned repositories
    └── uploads/                  # Extracted ZIP files
```

### ✨ Features Implemented (Day 1)

#### Backend Utilities

1. **cloneRepo.ts**
   - Clones GitHub repositories using `simple-git`
   - Stores clones in `/tmp/scanner/<random-id>`
   - Includes cleanup functionality
   - Shallow clone (depth 1) for faster operations

2. **extractZip.ts**
   - Accepts File or Buffer
   - Extracts to `/tmp/uploads/<random-id>`
   - Handles errors with automatic cleanup

3. **walkFiles.ts**
   - Recursively walks directories
   - Skips common directories:
     - `node_modules`, `.git`, `dist`, `build`, `.next`, `out`, `coverage`
   - Skips binary and image files:
     - Executables: `.exe`, `.dll`, `.so`, `.dylib`
     - Images: `.jpg`, `.png`, `.gif`, `.svg`, `.ico`
     - Archives: `.zip`, `.tar`, `.gz`, `.rar`
     - Documents: `.pdf`, `.doc`, `.xls`
   - Binary detection for additional safety

4. **detectCandidates.ts**
   - No ML/Regex (planned for later days)
   - Detects potential secrets using:
     - **Keyword matching**: password, secret, key, token, api_key, etc.
     - **Length check**: > 20 characters
     - **Entropy calculation**: Shannon entropy > 3.5
   - Returns:
     - File path
     - Line number
     - Candidate string (trimmed to 200 chars)
     - Reason for detection

#### API Routes

1. **POST /api/scan-url**
   - Receives: `{ repoUrl: string }`
   - Validates GitHub/GitLab/Bitbucket URLs
   - Clones repository
   - Walks files
   - Detects candidates
   - Returns: `ScanResult` JSON
   - Automatic cleanup

2. **POST /api/scan-upload**
   - Accepts: ZIP file via multipart/form-data
   - Validates file type
   - Extracts ZIP
   - Walks files
   - Detects candidates
   - Returns: `ScanResult` JSON
   - Automatic cleanup

#### TypeScript Interfaces

```typescript
interface Candidate {
  filePath: string;
  lineNumber: number;
  candidateString: string;
  reason?: string;
}

interface ScanResult {
  success: boolean;
  candidates: Candidate[];
  filesScanned: number;
  scanPath?: string;
  error?: string;
}

interface RepoScanRequest {
  repoUrl: string;
}
```

#### Frontend UI

- Modern dark theme with gradient styling
- Two-tab interface:
  - **Scan Repository URL**: Enter GitHub/GitLab/Bitbucket URL
  - **Upload ZIP File**: Upload and scan ZIP files
- Real-time loading states
- Results display:
  - Files scanned count
  - Candidates found count
  - Detailed candidate information (file path, line number, code snippet)
  - Error handling with clear messages

## Getting Started

### Installation

```bash
cd secret-detector
npm install
```

### Development

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:


Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing the Scanner

1. **Scan a GitHub Repository**:
   - Navigate to "Scan Repository URL" tab
   - Enter a repository URL (e.g., `https://github.com/username/repo`)
   - Click "Scan Repository"

2. **Scan a ZIP File**:
   - Navigate to "Upload ZIP File" tab
   - Select a ZIP file containing code
   - Click "Scan ZIP File"

### 📊 Day 1 Deliverables Status

- ✅ Working file walker with proper filtering
- ✅ Working repository cloning with simple-git
- ✅ Working ZIP extraction with adm-zip
- ✅ Basic candidate extraction (entropy + keywords)
- ✅ Working Next.js API endpoints
- ✅ Professional frontend UI
- ✅ Proper TypeScript interfaces
- ✅ Error handling and cleanup

### 🔜 Next Steps (Day 2+)

- Add ML-based secret detection
- Implement regex pattern matching
- Add more sophisticated entropy analysis
- Include confidence scoring
- Support for more file types
- Enhanced UI with filtering and sorting
- Database integration for scan history
- Export functionality (PDF, CSV)

### 📝 Notes

- Temporary files are automatically cleaned up after scanning
- The scanner uses shallow clones for faster performance
- Binary files are automatically skipped
- Entropy threshold of 3.5 is used to reduce false positives

---

**Built with ❤️ for Information Security Project**

