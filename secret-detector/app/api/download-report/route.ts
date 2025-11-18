import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('download-report: received request', { hasData: !!body.data, scanId: body.scanId });
    const report = JSON.stringify(body.data || body, null, 2);
    const blob = new Blob([report], { type: "application/json" });
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("Content-Disposition", `attachment; filename=report.json`);
    return new Response(blob, { status: 200, headers });
  } catch (e: any) {
    console.error('download-report: error', e?.message || e);
    return NextResponse.json({ error: e?.message || "Invalid request" }, { status: 400 });
  }
}
