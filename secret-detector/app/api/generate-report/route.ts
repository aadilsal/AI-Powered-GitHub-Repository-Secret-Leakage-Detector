import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
export const runtime = 'nodejs';

type RepoScanResponse = any;

async function generatePdfViaChild(data: RepoScanResponse, meta: any = {}) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'report-'));
  const inputPath = path.join(tmpDir, 'input.json');
  try {
    await fs.writeFile(inputPath, JSON.stringify({ data, meta }), 'utf8');

    const scriptPath = path.join(process.cwd(), 'scripts', 'generate-pdf.js');
    const nodePath = process.execPath; // path to node

    return await new Promise<Buffer>((resolve, reject) => {
      const child = spawn(nodePath, [scriptPath, inputPath], { stdio: ['ignore', 'pipe', 'inherit'] });
      const bufs: Buffer[] = [];
      child.stdout.on('data', (c: Buffer) => bufs.push(c));
      child.on('error', (err) => reject(err));
      child.on('close', (code) => {
        if (code === 0) {
          resolve(Buffer.concat(bufs));
        } else {
          reject(new Error(`PDF generator exited with code ${code}`));
        }
      });
    });
  } finally {
    // best-effort cleanup
    try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const format = (body.format || 'json').toString().toLowerCase();
    const data = body.data || body;
    const meta = body.meta || {};

    if (format === 'json') {
      const report = JSON.stringify(data, null, 2);
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.set('Content-Disposition', `attachment; filename=scan-report.json`);
      headers.set('Content-Length', String(Buffer.byteLength(report, 'utf8')));
      return new Response(report, { status: 200, headers });
    }

    const pdfBuffer = await generatePdfViaChild(data, meta);
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename=scan-report.pdf`);
    headers.set('Content-Length', String(pdfBuffer.length));
    const arrayBuffer = pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength);
    return new Response(arrayBuffer as ArrayBuffer, { status: 200, headers });
  } catch (e: any) {
    console.error('generate-report: error', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Failed to generate report' }, { status: 500 });
  }
}
