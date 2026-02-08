/**
 * MojiDoodle Collection Worker
 *
 * Receives segmentation training samples from the app.
 * Stores them in KV (small) or R2 (large) for later analysis.
 */

export interface Env {
  ALLOWED_ORIGINS: string;  // Comma-separated list of allowed origins
  SAMPLES?: KVNamespace;  // Enable in wrangler.toml after creating
  BUCKET?: R2Bucket;      // Enable in wrangler.toml after creating
  RATE_LIMIT?: KVNamespace;  // For rate limiting
}

// Rate limit: 60 requests per minute per IP
const RATE_LIMIT_WINDOW = 60; // seconds
const RATE_LIMIT_MAX = 60;

/**
 * Hash a string using SHA-256, return first 16 hex chars.
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

interface CollectionSample {
  id: string;
  userId: string;
  cardId: string;
  timestamp: number;
  success: boolean;
  strokes: { x: number; y: number; t: number }[][];
  canvasWidth: number;
  canvasHeight: number;
  segmentation: unknown;
  answers: string[];
  recognitionResults: unknown;
  groundTruth: unknown;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Dynamic CORS: reflect Origin if it's in the allowed list
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    const requestOrigin = request.headers.get('Origin') || '';
    const origin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];

    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'mojidoodle-collector' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only /collect accepts POST
    if (url.pathname !== '/collect') {
      return new Response('Not found', { status: 404, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders
      });
    }

    // Require JSON content type
    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json')) {
      return new Response('Content-Type must be application/json', {
        status: 415,
        headers: corsHeaders
      });
    }

    // Max body size: 1MB (samples are typically 10-100KB)
    const contentLength = parseInt(request.headers.get('Content-Length') || '0', 10);
    const maxBodySize = 1 * 1024 * 1024; // 1MB
    if (contentLength > maxBodySize) {
      return new Response(`Body too large: ${contentLength} bytes (max ${maxBodySize})`, {
        status: 413,
        headers: corsHeaders
      });
    }

    // Get client IP for rate limiting and audit
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    const userAgent = request.headers.get('User-Agent') || 'unknown';

    // Rate limiting (if KV configured)
    if (env.RATE_LIMIT) {
      const rateLimitKey = `rate:${clientIp}`;
      const current = parseInt(await env.RATE_LIMIT.get(rateLimitKey) || '0', 10);

      if (current >= RATE_LIMIT_MAX) {
        return new Response('Rate limit exceeded', {
          status: 429,
          headers: {
            ...corsHeaders,
            'Retry-After': String(RATE_LIMIT_WINDOW),
          }
        });
      }

      // Increment counter with TTL
      await env.RATE_LIMIT.put(rateLimitKey, String(current + 1), {
        expirationTtl: RATE_LIMIT_WINDOW,
      });
    }

    try {
      const sample: CollectionSample = await request.json();

      // Basic validation: required fields
      if (!sample.id || !sample.userId || !sample.cardId) {
        return new Response('Invalid sample: missing required fields (id, userId, cardId)', {
          status: 400,
          headers: corsHeaders
        });
      }

      // Validate strokes is an array of arrays
      if (!Array.isArray(sample.strokes)) {
        return new Response('Invalid sample: strokes must be an array', {
          status: 400,
          headers: corsHeaders
        });
      }

      // Validate answers is an array
      if (!Array.isArray(sample.answers) || sample.answers.length === 0) {
        return new Response('Invalid sample: answers must be a non-empty array', {
          status: 400,
          headers: corsHeaders
        });
      }

      // Validate canvas dimensions are positive numbers
      if (typeof sample.canvasWidth !== 'number' || sample.canvasWidth <= 0 ||
          typeof sample.canvasHeight !== 'number' || sample.canvasHeight <= 0) {
        return new Response('Invalid sample: canvasWidth and canvasHeight must be positive numbers', {
          status: 400,
          headers: corsHeaders
        });
      }

      // Hash IP and user agent for audit (privacy-preserving)
      const ipHash = await hashString(clientIp);
      const uaHash = await hashString(userAgent);

      // Generate storage key
      const key = `${sample.userId}/${sample.cardId}/${sample.id}.json`;

      // Server-side metadata (not in client JSON, stored separately for audit)
      const serverMetadata = {
        userId: sample.userId,
        cardId: sample.cardId,
        success: String(sample.success),
        timestamp: String(sample.timestamp),
        receivedAt: new Date().toISOString(),
        ipHash,
        uaHash,
        contentLength: String(contentLength),
      };

      // Store in R2 if available (preferred for larger data)
      if (env.BUCKET) {
        await env.BUCKET.put(key, JSON.stringify(sample), {
          customMetadata: serverMetadata,
        });
        console.log(`Stored in R2: ${key}`);
      }
      // Fallback to KV if available
      else if (env.SAMPLES) {
        await env.SAMPLES.put(key, JSON.stringify(sample), {
          metadata: serverMetadata,
        });
        console.log(`Stored in KV: ${key}`);
      }
      // No storage configured - just log
      else {
        console.log(`Received sample (no storage configured): ${key}`);
        console.log(`  Metadata:`, serverMetadata);
      }

      return new Response(JSON.stringify({
        success: true,
        id: sample.id,
        key
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });

    } catch (err) {
      console.error('Error processing sample:', err);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to process sample'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  },
};
