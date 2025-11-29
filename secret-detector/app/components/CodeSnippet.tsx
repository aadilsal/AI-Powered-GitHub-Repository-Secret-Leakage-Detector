"use client";
import React from "react";

export default function CodeSnippet({
  code,
  highlight,
}: {
  code: string;
  highlight?: string | null;
}) {
  // escape HTML
  let rendered = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (highlight) {
    const esc = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    rendered = rendered.replace(new RegExp(esc, "g"), (m) => `<mark class='bg-yellow-200 text-black rounded'>${m}</mark>`);
  }

  return (
    <div className="rounded-md overflow-hidden shadow-sm">
      <div className="bg-slate-900 text-white text-sm p-2">
        <pre className="whitespace-pre-wrap break-words text-xs leading-5" dangerouslySetInnerHTML={{ __html: rendered }} />
      </div>
    </div>
  );
}
