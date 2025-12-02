"use client";
import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import StatsHeader from "../components/StatsHeader";
import FilterBar from "../components/FilterBar";
import SecretCard from "../components/SecretCard";
import CodeSnippet from "../components/CodeSnippet";
import SeverityBadge from "../components/SeverityBadge";
import { motion } from "framer-motion";
import SeverityPie from "../components/charts/SeverityPie";
import TypeBar from "../components/charts/TypeBar";
import EntropyHistogram from "../components/charts/EntropyHistogram";
import ConfidenceHistogram from "../components/charts/ConfidenceHistogram";

export default function ResultsPage() {
  const params = useSearchParams();
  const scanId = params?.get("scanId") || "";
  const qc = useQueryClient();
  const data: any = qc.getQueryData(["scan", scanId]);
  console.log(`ResultsPage: loaded scanId=${scanId} dataFound=${!!data}`);

  const [severity, setSeverity] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [reveal, setReveal] = useState(false);

  const findings: any[] = data?.findings || [];
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 200;
  const totalPages = Math.max(1, Math.ceil((findings || []).length / PAGE_SIZE));
  const stats = useMemo(() => {
    const total = findings.length;
    const high = findings.filter((f) => f.severity === "HIGH").length;
    const medium = findings.filter((f) => f.severity === "MEDIUM").length;
    const low = findings.filter((f) => f.severity === "LOW").length;
    const files = Array.from(new Set(findings.map((f) => f.file || f.filePath))).length;
    return { total, high, medium, low, files };
  }, [findings]);

  const filtered = findings.filter((f) => {
    if (severity !== "ALL" && f.severity !== severity) return false;
    if (type !== "ALL" && !(f.type || f.secretType || "").toUpperCase().includes(type)) return false;
    if (query && !((f.file || f.filePath || "").toLowerCase().includes(query.toLowerCase()))) return false;
    return true;
  });

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const onDownload = async () => {
    console.log('ResultsPage: download requested for', scanId);
    const res = await fetch("/api/download-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scanId, data }),
    });
    if (!res.ok) return alert("Failed to download");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scanId || "scan"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadGenerated = async (format: 'json' | 'pdf') => {
    try {
      const meta = {
        projectTitle: data?.repo || scanId || 'Scan Report',
        groupMembers: '',
        mlModelVersion: 'v1',
        repoUrl: data?.repo,
      };
      const payload = { data, format, meta };
      const res = await fetch('/api/generate-report', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return alert('Failed to generate report: ' + (err?.error || res.statusText));
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scan-report.${format === 'pdf' ? 'pdf' : 'json'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error('downloadGenerated error', e);
      alert('Failed to generate report');
    }
  };

  return (
    <main className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => window.location.href = '/'} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
          <h2 className="text-2xl font-bold">Scan Results</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => downloadGenerated('json')} className="px-3 py-1 bg-slate-800 text-white rounded">Download JSON</button>
          <button onClick={() => downloadGenerated('pdf')} className="px-3 py-1 bg-sky-600 text-white rounded">Download PDF</button>
        </div>
      </div>

      <StatsHeader total={stats.total} high={stats.high} medium={stats.medium} low={stats.low} files={stats.files} />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <SeverityPie findings={findings} />
        </div>
        <div className="lg:col-span-1">
          <EntropyHistogram findings={findings} />
        </div>
        <div className="lg:col-span-1">
          <ConfidenceHistogram findings={findings} />
        </div>
        <div className="lg:col-span-1">
          <TypeBar findings={findings} />
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded shadow">
        <FilterBar severity={severity} setSeverity={setSeverity} type={type} setType={setType} query={query} setQuery={setQuery} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-3">
          {!data ? (
            // scanning skeleton
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-white rounded-md p-4 shadow-sm">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-md p-8 text-center">
              <div className="text-2xl font-semibold">No secrets found 🎉</div>
              <div className="text-slate-600 mt-2">Great job — we didn't detect any likely secret leaks in this scan.</div>
            </div>
          ) : (
            paged.map((f) => (
              <SecretCard key={`${f.file}-${f.startLine || f.line || Math.random()}`} finding={f} onOpen={setSelected} />
            ))
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 bg-slate-100 rounded">Prev</button>
              <div className="text-sm text-slate-600">Page {page} / {totalPages}</div>
              <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 bg-slate-100 rounded">Next</button>
            </div>
          ) : null}
        </div>

        <aside className="col-span-1 sticky top-6">
          <div className="bg-white p-4 rounded shadow">
            {!data ? (
              <div className="text-center py-8">
                <div className="text-lg font-semibold">Scanning…</div>
                <div className="mt-3 flex items-center justify-center gap-1 text-xl">
                  <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }}>.</motion.span>
                  <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.15 }}>.</motion.span>
                  <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.3 }}>.</motion.span>
                </div>
              </div>
            ) : data.error ? (
              <div className="text-center py-6">
                <div className="text-lg font-semibold text-red-600">Error scanning repository</div>
                <div className="text-sm text-slate-600 mt-2">{data.error}</div>
                <div className="mt-4">
                  <button onClick={() => window.history.back()} className="px-3 py-1 bg-slate-800 text-white rounded">Go Back</button>
                </div>
              </div>
            ) : selected ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">Details</div>
                  <SeverityBadge severity={selected.severity} />
                </div>
                <div className="text-sm text-slate-600">Type: {selected.type || selected.secretType}</div>
                <div className="text-sm text-slate-600 break-words">File: <span title={selected.file || selected.filePath}>{(selected.file || selected.filePath || '').toString().replace(/\\/g, '/').split('/').pop() || 'unknown'}</span></div>
                <div className="text-sm text-slate-600">Line: {selected.line || selected.startLine || "-"}</div>
                <div className="text-sm text-slate-600">ML Confidence: {(selected.mlConfidence||0)*100}%</div>
                <div className="text-sm text-slate-600">Entropy: {selected.entropy}</div>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-slate-500">Content</div>
                    <button onClick={() => setReveal((s) => !s)} className="text-sm text-slate-700 underline">
                      {reveal ? "Hide secret" : "Show secret"}
                    </button>
                  </div>
                  <CodeSnippet
                    code={
                      reveal
                        ? selected.beforeAndAfter || selected.context || selected.content || ""
                        : (selected.beforeAndAfter || selected.context || selected.content || "").replace(/[^\n]/g, "•")
                    }
                    highlight={reveal ? (selected.match || selected.matched || selected.value || null) : null}
                  />
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">Select a finding to see details</div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
