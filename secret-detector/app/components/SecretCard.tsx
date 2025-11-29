"use client";
import React from "react";
import SeverityBadge from "./SeverityBadge";
import FilePathDisplay from "./FilePathDisplay";
import EntropyBar from "./EntropyBar";
import { motion } from "framer-motion";

export default function SecretCard({
  finding,
  onOpen,
}: {
  finding: any;
  onOpen: (f: any) => void;
}) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-md p-3 shadow-sm flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SeverityBadge severity={finding.severity} />
            <div className="text-sm font-medium">{finding.type || finding.secretType || "Secret"}</div>
          </div>
          <div className="text-sm text-slate-500">Hybrid {((finding.hybridScore||0)*100).toFixed(0)}%</div>
        </div>

        <div className="mt-2">
          <FilePathDisplay path={finding.filePath || finding.file || "unknown"} />
        </div>

        <div className="mt-3 flex items-center gap-4">
          <EntropyBar value={finding.entropy || 0} />
          <div className="text-sm text-slate-500">ML {Math.round((finding.mlConfidence||0)*100)}%</div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => onOpen(finding)}
          className="px-3 py-1 bg-slate-800 text-white rounded-md text-sm"
        >
          Open
        </button>
      </div>
    </motion.div>
  );
}
