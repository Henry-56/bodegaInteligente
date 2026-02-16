import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function error(code: string, status: number, details?: unknown) {
  return NextResponse.json({ error: code, details }, { status });
}
