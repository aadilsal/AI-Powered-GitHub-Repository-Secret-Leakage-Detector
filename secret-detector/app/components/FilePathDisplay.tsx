"use client";
import React from "react";
import { Folder } from "lucide-react";

export default function FilePathDisplay({ path }: { path: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-700">
      <Folder className="w-4 h-4 text-slate-500" />
      <span className="truncate">{path}</span>
    </div>
  );
}
