"use client";
import React, { useState } from "react";
import { Folder, Copy } from "lucide-react";

export default function FilePathDisplay({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(path);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const filename = path ? path.replace(/\\/g, '/').split('/').pop() || path : 'unknown';

  return (
    <div className="flex items-start gap-2 text-sm text-slate-700">
      <Folder className="w-4 h-4 text-slate-500 mt-1" />
      <div className="flex-1">
        <div className="text-sm text-slate-700" title={path}>{filename}</div>
      </div>
      <button onClick={copy} title="Copy full file path" className="p-1 rounded hover:bg-slate-100">
        <Copy className="w-4 h-4 text-slate-500" />
      </button>
      {copied ? <div className="text-xs text-sky-600">Copied</div> : null}
    </div>
  );
}
