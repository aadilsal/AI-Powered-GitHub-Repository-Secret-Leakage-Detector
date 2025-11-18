"use client";
import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  console.log('QueryProvider: created QueryClient');
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
