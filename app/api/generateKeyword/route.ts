// app/api/generate-keywords/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getCachedModel } from "@/lib/getChacedModel";
import { generateKeywords } from "@/app/actions/generateKeywords";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    // ✅ Works in API routes
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    const model = getCachedModel("llama-3.3-70b-versatile", 0.5, 300, apiKey);

    // Your keyword generation logic here
    const newKeywords = await generateKeywords(text, model);

    return NextResponse.json({ newKeywords });
  } catch (error) {
    console.error("Error generating keywords:", error);
    return NextResponse.json(
      { error: "Failed to generate keywords" },
      { status: 500 },
    );
  }
}
