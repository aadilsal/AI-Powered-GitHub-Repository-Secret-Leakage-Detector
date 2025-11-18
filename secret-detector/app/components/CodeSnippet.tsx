"use client";
import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function CodeSnippet({
  code,
  highlight,
}: {
  code: string;
  highlight?: string | null;
}) {
  // simple highlight by wrapping occurrences with <mark>
  let rendered = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (highlight) {
    const esc = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    rendered = rendered.replace(new RegExp(esc, "g"), (m) => `<mark class='bg-yellow-200 text-black'>${m}</mark>`);
  }

  return (
    <div className="rounded-md overflow-hidden shadow-sm">
      <div className="bg-slate-900 text-white text-sm p-2">
        <div dangerouslySetInnerHTML={{ __html: rendered.split("\n").map((l) => `${l}\n`).join("") }} />
      </div>
    </div>
  );
}
