"use client";
import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import StatsHeader from "../components/StatsHeader";
import FilterBar from "../components/FilterBar";
import SecretCard from "../components/SecretCard";
import CodeSnippet from "../components/CodeSnippet";
import SeverityBadge from "../components/SeverityBadge";

export default function ResultsPage() {
  const params = useSearchParams();
  const scanId = params?.get("scanId") || "";
  const qc = useQueryClient();
  const data: any = qc.getQueryData(["scan", scanId]);

  const [severity, setSeverity] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [reveal, setReveal] = useState(false);

  const findings: any[] = data?.findings || [];
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

  const onDownload = async () => {
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

  return (
    <main className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Scan Results</h2>
        <div className="flex gap-2">
          <button onClick={onDownload} className="px-3 py-1 bg-slate-800 text-white rounded">Download Report</button>
        </div>
      </div>

      <StatsHeader total={stats.total} high={stats.high} medium={stats.medium} low={stats.low} files={stats.files} />

      <div className="mt-6 bg-white p-4 rounded shadow">
        <FilterBar severity={severity} setSeverity={setSeverity} type={type} setType={setType} query={query} setQuery={setQuery} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-3">
          {filtered.map((f) => (
            <SecretCard key={`${f.file}-${f.startLine || f.line || Math.random()}`} finding={f} onOpen={setSelected} />
          ))}
        </div>

        <aside className="col-span-1 sticky top-6">
          <div className="bg-white p-4 rounded shadow">
            {selected ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">Details</div>
                  <SeverityBadge severity={selected.severity} />
                </div>
                <div className="text-sm text-slate-600">Type: {selected.type || selected.secretType}</div>
                <div className="text-sm text-slate-600">File: {selected.file || selected.filePath}</div>
                <div className="text-sm text-slate-600">Line: {selected.line || selected.startLine || "-"}</div>
                <div className="text-sm text-slate-600">ML Confidence: {(selected.mlConfidence||0)*100}%</div>
                <div className="text-sm text-slate-600">Entropy: {selected.entropy}</div>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-slate-500">Content (masked by default)</div>
                    <button onClick={() => setReveal((s) => !s)} className="text-sm text-slate-700 underline">
                      {reveal ? "Hide" : "Reveal"}
                    </button>
                  </div>
                  <CodeSnippet
                    code={
                      reveal
                        ? selected.beforeAndAfter || selected.context || selected.content || ""
                        : (selected.beforeAndAfter || selected.context || selected.content || "").replace(/./g, "•")
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
