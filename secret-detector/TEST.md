# Test Script for Secret Detector APIs

## Test 1: Scan Repository URL

You can test the API using PowerShell:

```powershell
# Test scan-url endpoint
$body = @{
    repoUrl = "https://github.com/octocat/Hello-World"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/scan-url" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" | Select-Object -ExpandProperty Content
```

Or using curl:

```bash
curl -X POST http://localhost:3000/api/scan-url \
  -H "Content-Type: application/json" \
  -d '{"repoUrl":"https://github.com/octocat/Hello-World"}'
```

## Test 2: Scan ZIP Upload

Create a test ZIP file with some sample code, then:

```powershell
# Test scan-upload endpoint
$form = @{
    file = Get-Item "path/to/your/test.zip"
}

Invoke-WebRequest -Uri "http://localhost:3000/api/scan-upload" `
    -Method POST `
    -Form $form | Select-Object -ExpandProperty Content
```

## Expected Response Format

```json
{
  "success": true,
  "candidates": [
    {
      "filePath": "/path/to/file.js",
      "lineNumber": 42,
      "candidateString": "const apiKey = \"your_api_key_here_with_high_entropy_value_12345\"",
      "reason": "High entropy (4.12) with secret keyword"
    }
  ],
  "filesScanned": 15,
  "scanPath": "https://github.com/username/repo"
}
```

## Test via UI

Open your browser to http://localhost:3000 and use the visual interface to test both:
1. Repository URL scanning
2. ZIP file upload scanning
