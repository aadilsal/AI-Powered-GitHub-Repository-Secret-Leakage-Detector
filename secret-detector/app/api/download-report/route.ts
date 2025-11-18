import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const report = JSON.stringify(body.data || body, null, 2);
    const blob = new Blob([report], { type: "application/json" });
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("Content-Disposition", `attachment; filename=report.json`);
    return new Response(blob, { status: 200, headers });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Invalid request" }, { status: 400 });
  }
}
