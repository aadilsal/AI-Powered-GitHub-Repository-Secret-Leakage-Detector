"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UploadCloud } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

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
    }
  };

  const onScanUpload = async () => {
    const files = fileRef.current?.files;
    if (!files || files.length === 0) return alert("Select a zip file first");
    const f = files[0];
    const form = new FormData();
    form.append("file", f);
    setScanning(true);
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
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                onClick={onScanUrl}
                className="px-4 py-2 bg-slate-800 text-white rounded"
                disabled={scanning}
              >
                {scanning ? "Scanning…" : "Scan"}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Upload ZIP</label>
            <div className="mt-2 border-dashed border-2 border-slate-200 rounded p-4 flex flex-col gap-3 items-start">
              <div className="flex items-center gap-2 text-slate-600">
                <UploadCloud className="w-5 h-5" /> Drag & drop a .zip file or choose
              </div>
              <input ref={fileRef} type="file" accept=".zip" />
              <div className="mt-2">
                <button
                  onClick={onScanUpload}
                  className="px-4 py-2 bg-slate-800 text-white rounded"
                  disabled={scanning}
                >
                  {scanning ? "Scanning uploaded project…" : "Scan Uploaded Project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

