const env = import.meta.env;
const supabaseUrl = env.VITE_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

export interface StreamaxLivePreviewRequest {
  deviceId: string;
  channelNo?: number;
  streamType?: 'MAIN_STREAM' | 'SUB_STREAM';
  streamingProtocol?: 'HLS' | 'FLV' | 'RTMP' | 'WEBRTC' | 'WS';
  quality?: 'SMOOTH' | 'HD' | 'SD';
  audio?: 'ON' | 'OFF';
}

export interface StreamaxLivePreviewResponse {
  deviceId: string;
  channelNo: number;
  streamType: 'MAIN_STREAM' | 'SUB_STREAM';
  streamingProtocol: 'HLS' | 'FLV' | 'RTMP' | 'WEBRTC' | 'WS';
  expiresAt: string;
  diagnosticOnly?: boolean;
  playback?: {
    url?: string;
    protocol?: string;
  };
  error?: string;
  code?: string;
}

export async function fetchStreamaxLivePreviewUrl(request: StreamaxLivePreviewRequest) {
  if (!supabaseUrl) throw new Error('Missing Supabase URL.');

  const response = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/functions/v1/streamax-live-preview-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(supabaseAnonKey ? { apikey: supabaseAnonKey } : {}),
    },
    body: JSON.stringify({
      action: 'request',
      deviceId: request.deviceId,
      channelNo: request.channelNo ?? 1,
      streamType: request.streamType ?? 'SUB_STREAM',
      streamingProtocol: request.streamingProtocol ?? 'HLS',
      quality: request.quality ?? 'SMOOTH',
      audio: request.audio ?? 'OFF',
    }),
  });

  const data = await response.json().catch(() => null) as StreamaxLivePreviewResponse | null;
  if (!response.ok || data?.error) {
    throw new Error(data?.error || `Streamax live preview failed with HTTP ${response.status}`);
  }

  const streamUrl = data?.playback?.url?.trim() || '';
  if (!streamUrl) {
    throw new Error(data?.code || 'Streamax did not return a playback URL.');
  }

  return streamUrl;
}
