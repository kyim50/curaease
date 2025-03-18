// app/api/medical-ai/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'edge';

const UPSTASH_REDIS_REST_URL = 'https://logical-griffon-60352.upstash.io';
const UPSTASH_REDIS_REST_TOKEN = 'AevAAAIjcDE1ZDg4OWVhYTQ0ZmU0OTIyYjU3MTY4NzFlNGI1Y2Q3MHAxMA';
const OPENROUTER_API_KEY = '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';

function postProcessMedicalTerminology(text: string): string {
  return text.replace(/\b([A-Z]\d{2})\b/g, (match) => `[${match}]`);
}

async function checkRateLimit(identifier: string): Promise<{ allowed: boolean, remaining: number }> {
  const key = `rate_limit_${identifier}`;
  const url = `${UPSTASH_REDIS_REST_URL}/get/${key}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    },
  });
  
  const data = await response.json();
  const currentCount = parseInt(data.result || '0', 10);

  if (currentCount >= 5) {
    return { allowed: false, remaining: 5 - currentCount };
  }

  // Increment the count
  await fetch(`${UPSTASH_REDIS_REST_URL}/incr/${key}`, {
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    },
  });
  
  // Set expiration if this is the first increment
  if (currentCount === 0) {
    await fetch(`${UPSTASH_REDIS_REST_URL}/expire/${key}/86400`, {
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      },
    });
  }

  return { allowed: true, remaining: 5 - (currentCount + 1) };
}

export async function POST(req: Request) {
  const { messages } = await req.json();
  const identifier = req.headers.get('x-real-ip') || 'default';

  try {
    // Check rate limit
    const rateLimitStatus = await checkRateLimit(identifier);
    if (!rateLimitStatus.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Daily limit exceeded' }),
        { status: 429, headers: { 'X-RateLimit-Remaining': rateLimitStatus.remaining.toString() } }
      );
    }

    // Medical system prompt
    const medicalSystemPrompt = `You are a medical AI assistant...`; // Keep your existing prompt

    // Use OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': `${process.env.NEXT_PUBLIC_SITE_URL}/`, // Required by OpenRouter
        'X-Title': 'Medical Symptom Checker' // Required by OpenRouter
      },
      body: JSON.stringify({
        model: 'deepseek-ai/deepseek-coder-33b-instruct', // Example model
        messages: [
          { role: 'system', content: medicalSystemPrompt },
          ...messages
        ],
        temperature: 0.2,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const processedResponse = postProcessMedicalTerminology(data.choices[0].message.content);

    return NextResponse.json({ 
      response: processedResponse,
      rateLimit: {
        remaining: rateLimitStatus.remaining
      }
    });

  } catch (error: unknown) {
    console.error('Server Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}