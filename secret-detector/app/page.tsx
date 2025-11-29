"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UploadCloud } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [slowNotice, setSlowNotice] = useState(false);
  const slowTimer = useRef<number | null>(null);

  const isValidGithubUrl = (u: string) => {
    try {
      if (!u) return false;
      const re = /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(\/.*)?$/;
      return re.test(u.trim());
    } catch {
      return false;
    }
  };

  const scanUrl = useMutation<any, Error, string>({
    mutationFn: async (repoUrl: string) => {
      const res = await fetch("/api/scan-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });
      return res.json();
    },
  });

  const scanUpload = useMutation<any, Error, FormData>({
    mutationFn: async (form: FormData) => {
      const res = await fetch("/api/scan-upload", {
        method: "POST",
        body: form,
      });
      return res.json();
    },
  });

  const onScanUrl = async () => {
    if (!url) return;
    setScanning(true);
    setSlowNotice(false);
    if (slowTimer.current) window.clearTimeout(slowTimer.current);
    slowTimer.current = window.setTimeout(() => setSlowNotice(true), 8000);
    try {
      const data = await scanUrl.mutateAsync(url);
      const id = `scan_${Date.now()}`;
      qc.setQueryData(["scan", id], data);
      router.push(`/results?scanId=${id}`);
    } catch (e) {
      console.error(e);
      alert("Scan failed: " + (e as any)?.message);
    } finally {
      setScanning(false);
      setSlowNotice(false);
      if (slowTimer.current) { window.clearTimeout(slowTimer.current); slowTimer.current = null; }
    }
  };

  const onScanUpload = async () => {
    const files = fileRef.current?.files;
    if (!files || files.length === 0) return alert("Select a zip file first");
    const f = files[0];
    const form = new FormData();
    form.append("file", f);
    setScanning(true);
    setSlowNotice(false);
    if (slowTimer.current) window.clearTimeout(slowTimer.current);
    slowTimer.current = window.setTimeout(() => setSlowNotice(true), 8000);
    try {
      const data = await scanUpload.mutateAsync(form);
      const id = `scan_${Date.now()}`;
      qc.setQueryData(["scan", id], data);
      router.push(`/results?scanId=${id}`);
    } catch (e) {
      console.error(e);
      alert("Upload scan failed");
    } finally {
      setScanning(false);
      setSlowNotice(false);
      if (slowTimer.current) { window.clearTimeout(slowTimer.current); slowTimer.current = null; }
    }
  };

  return (
    <main className="container mx-auto px-6 py-12">
      <section className="bg-white rounded-md p-8 shadow-md">
        <h1 className="text-3xl font-bold">GitHub Repository Secret Leakage Detector</h1>
        <p className="text-slate-600 mt-2">Scan repositories for leaked credentials using AI + Regex + Entropy</p>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium">GitHub repository URL</label>
            <div className="flex gap-2 mt-2">
              <div className="flex-1">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="w-full border rounded px-3 py-2"
                />
                <div className="text-xs text-slate-500 mt-2">Examples:</div>
                <ul className="text-xs text-slate-500 list-disc ml-5">
                  <li>https://github.com/vercel/next.js</li>
                  <li>https://github.com/facebook/react</li>
                </ul>
              </div>
              <button
                onClick={onScanUrl}
                className="px-4 py-2 bg-slate-800 text-white rounded ml-3 disabled:opacity-50"
                disabled={scanning || !isValidGithubUrl(url)}
                title={isValidGithubUrl(url) ? "Start scan" : "Enter a valid GitHub repo URL"}
              >
                {scanning ? "Scanning…" : "Scan"}
              </button>
              {slowNotice ? (
                <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded ml-3">Taking longer than expected — please wait…</div>
              ) : null}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Upload ZIP</label>
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ scale: dragOver ? 1.02 : 1 }}
              className={`mt-2 border-dashed border-2 rounded p-4 flex flex-col gap-3 items-start transition-colors ${
                dragOver ? "border-sky-400 bg-sky-50" : "border-slate-200 bg-transparent"
              }`}
              onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e: React.DragEvent<HTMLDivElement>) => {
                e.preventDefault();
                setDragOver(false);
              }}
              onDrop={(e: React.DragEvent<HTMLDivElement>) => {
                e.preventDefault();
                setDragOver(false);
                const files = e.dataTransfer?.files;
                if (files && files.length > 0) {
                  const f = files[0];
                  if (f.name.toLowerCase().endsWith('.zip')) {
                    const dt = new DataTransfer();
                    dt.items.add(f);
                    if (fileRef.current) fileRef.current.files = dt.files;
                  } else {
                    alert('Please drop a .zip file');
                  }
                }
              }}
            >
              <div className="flex items-center gap-2 text-slate-600">
                <UploadCloud className="w-5 h-5" />
                <div>
                  <div className="font-medium">Drag & drop a .zip file</div>
                  <div className="text-xs text-slate-500">or click to choose a file</div>
                </div>
              </div>
              <input ref={fileRef} type="file" accept=".zip" className="mt-2" />
              <div className="mt-2 w-full flex items-center justify-between">
                <div className="text-xs text-slate-500">Only .zip archives of repositories are supported.</div>
                <button
                  onClick={onScanUpload}
                  className="px-4 py-2 bg-slate-800 text-white rounded disabled:opacity-50"
                  disabled={scanning || !(fileRef.current && fileRef.current.files && fileRef.current.files.length > 0)}
                >
                  {scanning ? "Scanning uploaded project…" : "Scan Uploaded Project"}
                </button>
                {slowNotice ? (
                  <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded ml-3">Taking longer than expected — please wait…</div>
                ) : null}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}

