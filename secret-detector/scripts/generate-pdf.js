#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function safeReadJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: generate-pdf <inputJsonPath>');
  process.exit(2);
}

const payload = safeReadJson(inputPath) || {};
const data = payload.data || payload;
const meta = payload.meta || {};

// Require pdfkit at runtime so bundlers don't try to inline it
const PDFDocument = require('pdfkit');

try {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  // Pipe PDF binary to stdout
  doc.pipe(process.stdout);

  // Header
  doc.fontSize(20).text(meta.projectTitle || data.repo || 'Scan Report', { align: 'left' });
  doc.moveDown(0.2);
  doc.fontSize(10).fillColor('grey').text(`Generated: ${new Date().toISOString()}`);
  if (meta.groupMembers) doc.text(`Group members: ${meta.groupMembers}`);
  doc.moveDown(0.8);

  // Summary
  const total = data?.totalFindings ?? (data?.findings?.length ?? 0);
  const files = data?.totalFiles ?? (Array.from(new Set((data?.findings||[]).map((f)=>f.file || f.filePath))).length || 0);
  doc.fontSize(12).fillColor('black').text('Summary', { underline: true });
  doc.moveDown(0.2);
  doc.fontSize(10).text(`Repository: ${data?.repo || meta.repoUrl || 'n/a'}`);
  doc.text(`Total findings: ${total}`);
  doc.text(`Files scanned: ${files}`);
  doc.text(`ML model version: ${meta.mlModelVersion || 'unknown'}`);
  doc.text(`Total entropy signals: ${(data?.findings||[]).filter((f)=>f.entropy).length}`);
  doc.text(`Regex matches: ${(data?.findings||[]).filter((f)=>f.regexMatch||f.regex).length}`);
  doc.moveDown(0.6);

  // Severity counts
  const sevCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const f of data?.findings || []) {
    const s = (f.severity || '').toString().toUpperCase();
    if (s === 'HIGH') sevCounts.HIGH += 1;
    else if (s === 'MEDIUM') sevCounts.MEDIUM += 1;
    else if (s === 'LOW') sevCounts.LOW += 1;
  }

  doc.fontSize(11).text('Severity breakdown');
  doc.moveDown(0.2);
  const maxCount = Math.max(1, sevCounts.HIGH, sevCounts.MEDIUM, sevCounts.LOW);
  const barMaxW = 300;

  const drawBar = (label, value, color) => {
    doc.fillColor('black').fontSize(10).text(`${label} (${value})`, { continued: true });
    const curX = doc.x + 6;
    const barW = Math.round((value / maxCount) * barMaxW);
    doc.fillColor(color).rect(curX, doc.y - 8, barW, 10).fill();
    doc.moveDown(1.2);
  };

  drawBar('HIGH', sevCounts.HIGH, '#ef4444');
  drawBar('MEDIUM', sevCounts.MEDIUM, '#f59e0b');
  drawBar('LOW', sevCounts.LOW, '#10b981');

  doc.moveDown(0.6);

  // Top 10 secrets
  doc.fontSize(12).text('Top 10 secrets', { underline: true });
  doc.moveDown(0.2);
  const top = (data?.findings || []).slice(0).sort((a,b)=> (b.hybridScore||0)-(a.hybridScore||0)).slice(0,10);
  for (const f of top) {
    const file = f.file || f.filePath || 'unknown';
    const line = f.line || f.startLine || '-';
    const type = f.type || f.secretType || 'Secret';
    doc.fontSize(10).fillColor('black').text(`${type} — ${file}:${line}`);
    const snippet = (f.beforeAndAfter || f.context || f.content || '').toString();
    const masked = snippet.replace(/[^\n]/g, '*').slice(0, 300);
    doc.fontSize(9).fillColor('grey').text(masked);
    doc.moveDown(0.3);
  }

  doc.addPage();

  // Remediation guidelines
  doc.fontSize(14).fillColor('black').text('Remediation Guidelines', { underline: true });
  doc.moveDown(0.3);
  const guidelines = [
    'Rotate any exposed credentials immediately.',
    'Remove secrets from the repository and add them to a secrets manager.',
    'Add the affected keys to your provider (GitHub, AWS, etc.) to revoke and recreate.',
    'Add scans to CI to prevent future leaks.',
    'Use environment variables and vaults for runtime secrets.'
  ];
  doc.fontSize(10).fillColor('black');
  for (const g of guidelines) {
    doc.text(`• ${g}`);
    doc.moveDown(0.2);
  }

  doc.end();
} catch (err) {
  console.error('generate-pdf.js error', err);
  process.exit(1);
}
