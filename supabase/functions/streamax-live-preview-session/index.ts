import CryptoJS from 'https://esm.sh/crypto-js@4.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_BASE_URL = 'https://ap-ftcloud.ifleetvision.com:20501/openapi';
const DEFAULT_APP_ID = '10001';
const DEFAULT_TENANT_ID = '1272';

type StreamaxConfig = {
  baseUrl: string;
  tenantId: string;
  tenantSecret: string;
  appId: string;
  timeoutMs: number;
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const config = loadConfig();
    if (!config.tenantSecret) {
      return jsonResponse({ error: 'Missing STREAMAX_FTCLOUD_TENANT_SECRET', code: 'CONFIG_MISSING' }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'request').trim();
    if (action !== 'request') {
      return jsonResponse({ error: 'Unsupported action', code: 'UNSUPPORTED_ACTION' }, 400);
    }

    const deviceId = stringValue(body.deviceId || body.device_id);
    if (!deviceId) return jsonResponse({ error: 'deviceId is required', code: 'DEVICE_ID_REQUIRED' }, 400);

    const channelNo = boundedInteger(body.channelNo || body.channel_no, 1, 1, 32);
    const streamType = enumValue(body.streamType || body.stream_type, ['MAIN_STREAM', 'SUB_STREAM'], 'SUB_STREAM');
    const streamingProtocol = enumValue(body.streamingProtocol || body.streaming_protocol, ['HLS', 'FLV', 'RTMP', 'WEBRTC', 'WS'], 'HLS');
    const quality = enumValue(body.quality, ['SMOOTH', 'HD', 'SD'], 'SMOOTH');
    const audio = enumValue(body.audio, ['ON', 'OFF'], 'OFF');

    const liveResult = await ftcloudRequest(config, {
      method: 'GET',
      path: `/v2/devices/${encodeURIComponent(deviceId)}/live-links`,
      query: {
        channels: String(channelNo),
        streamingProtocol,
        streamType,
        quality,
        audio,
      },
    });

    const liveUrl = extractFirstUrl(liveResult.payload);
    const providerSession = extractFirstSession(liveResult.payload);

    if (!liveResult.ok || !liveUrl || !providerSession) {
      return jsonResponse({
        error: liveResult.errorMessage || 'Streamax live preview request failed',
        code: liveResult.errorCode || 'STREAMAX_PROVIDER_LIVE_PREVIEW_FAILED',
        providerPayload: liveResult.payload,
      }, 502);
    }

    return jsonResponse({
      deviceId,
      channelNo,
      streamType,
      streamingProtocol,
      playback: {
        url: liveUrl,
        protocol: liveUrl.toLowerCase().includes('.m3u8') ? 'HLS' : 'unknown',
      },
      providerSession,
      expiresAt: new Date(Date.now() + 25_000).toISOString(),
    });
  } catch (error) {
    return jsonResponse({ error: safeErrorMessage(error), code: 'STREAMAX_LIVE_PREVIEW_RUNTIME_ERROR' }, 500);
  }
});

async function ftcloudRequest(
  config: StreamaxConfig,
  endpoint: {
    method: 'GET' | 'POST';
    path: string;
    query?: Record<string, string>;
    body?: Record<string, unknown>;
  },
) {
  const signed = signStreamaxRequest(config);
  const url = new URL(`${config.baseUrl.replace(/\/+$/, '')}${endpoint.path}`);

  for (const [key, value] of Object.entries(endpoint.query || {})) {
    url.searchParams.set(key, value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        _tenantid: signed.tenantId,
        _sign: signed.sign,
      },
      body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
      signal: controller.signal,
    });

    const text = await response.text();
    const payload = parseJson(text);
    const providerSuccess = payload?.success !== false && !isIllegalUser(payload);

    return {
      ok: response.ok && providerSuccess,
      httpStatus: response.status,
      payload,
      errorCode: response.ok ? providerErrorCode(payload) : `http_${response.status}`,
      errorMessage: providerErrorMessage(payload) || `FTCloud HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      payload: null,
      errorCode: 'streamax_request_failed',
      errorMessage: safeErrorMessage(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function signStreamaxRequest(config: StreamaxConfig) {
  const signTime = Date.now();
  const signJson = `{"appId":${Number(config.appId || DEFAULT_APP_ID)},"signTime":${signTime},"tenantId":${Number(config.tenantId || DEFAULT_TENANT_ID)},"tenantSecret":"${escapeJsonString(config.tenantSecret)}"}`;
  const base64Payload = btoa(unescape(encodeURIComponent(signJson)));
  const aesKey = CryptoJS.MD5(config.tenantSecret);
  const encrypted = CryptoJS.AES.encrypt(base64Payload, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    tenantId: String(config.tenantId || DEFAULT_TENANT_ID),
    sign: encrypted.ciphertext.toString(CryptoJS.enc.Hex).toLowerCase(),
  };
}

function extractFirstSession(payload: unknown): string {
  return extractByKey(payload, /^session$/i)[0] || '';
}

function extractFirstUrl(payload: unknown): string {
  return collectUrls(payload)[0] || '';
}

function extractByKey(payload: unknown, pattern: RegExp, found: string[] = []): string[] {
  if (!payload || found.length >= 20) return found;

  if (Array.isArray(payload)) {
    payload.forEach((item) => extractByKey(item, pattern, found));
    return found;
  }

  if (typeof payload === 'object') {
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      if (pattern.test(key) && typeof value === 'string' && value.trim()) found.push(value.trim());
      else extractByKey(value, pattern, found);
    }
  }

  return found;
}

function collectUrls(payload: unknown, found: string[] = []): string[] {
  if (!payload || found.length >= 20) return found;

  if (typeof payload === 'string') {
    if (/^https?:\/\//i.test(payload)) found.push(payload);
    return found;
  }

  if (Array.isArray(payload)) {
    payload.forEach((item) => collectUrls(item, found));
    return found;
  }

  if (typeof payload === 'object') {
    Object.values(payload as Record<string, unknown>).forEach((value) => collectUrls(value, found));
  }

  return found;
}

function isIllegalUser(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const record = payload as Record<string, unknown>;
  return String(record.code || '') === '3806' || String(record.message || '').toLowerCase().includes('illegal user');
}

function providerErrorCode(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  return stringValue(record.code || record.errorCode) || null;
}

function providerErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  return stringValue(record.message || record.msg || record.error) || null;
}

function loadConfig(): StreamaxConfig {
  return {
    baseUrl: env('STREAMAX_FTCLOUD_API_BASE_URL') || DEFAULT_BASE_URL,
    tenantId: env('STREAMAX_FTCLOUD_TENANT_ID') || DEFAULT_TENANT_ID,
    tenantSecret: env('STREAMAX_FTCLOUD_TENANT_SECRET'),
    appId: env('STREAMAX_FTCLOUD_APP_ID') || DEFAULT_APP_ID,
    timeoutMs: Number(env('STREAMAX_FTCLOUD_TIMEOUT_MS') || '15000'),
  };
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function parseJson(text: string) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { textPreview: text.slice(0, 160) };
  }
}

function safeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 300) : String(error).slice(0, 300);
}

function escapeJsonString(value: string) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function enumValue(value: unknown, allowed: string[], fallback: string) {
  const normalized = stringValue(value).toUpperCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

function boundedInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function env(key: string) {
  return String(Deno.env.get(key) || '').trim();
}
