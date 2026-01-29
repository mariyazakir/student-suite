import { NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

export async function GET() {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_API_KEY not configured.' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_API_KEY}`
    );

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        { error: `Gemini API error: ${response.status} ${response.statusText}`, detail },
        { status: 500 }
      );
    }

    const payload = (await response.json()) as { models?: Array<{ name: string }> };
    const modelNames = payload.models?.map((model) => model.name) ?? [];

    return NextResponse.json({ models: modelNames });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
