import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/*
  DATASET TRANSPORT ENDPOINT — CANONICAL

  HARD RULES:
  - Source of truth: /public/dataset/latest.jsonl
  - NDJSON only
  - byte-identical output
  - no runtime mutation
  - no sorting
  - no regeneration
*/

export function GET() {
  const filePath = path.join(
    process.cwd(),
    "public",
    "dataset",
    "latest.jsonl"
  );

  const data = fs.readFileSync(filePath);

  return new NextResponse(data, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-transform"
    }
  });
}