import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json(
    {
      dataset: "cryptoreference",
      channel: "latest",
      registry: "/dataset/registry.json"
    },
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}