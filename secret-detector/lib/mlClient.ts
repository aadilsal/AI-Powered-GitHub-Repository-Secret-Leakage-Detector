export interface MLResult {
  prediction: number;
  confidence: number;
}

const DEFAULT_TIMEOUT = 3000;

export async function predictWithML(text: string, timeout = DEFAULT_TIMEOUT): Promise<MLResult> {
  const url = 'http://127.0.0.1:8000/predict';

  console.log(`ML client: requesting prediction for text (len=${text.length})`);

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!resp.ok) {
      console.warn('ML client: non-OK response from ML server', resp.status);
      return { prediction: 0, confidence: 0 };
    }

    const data = await resp.json();
    console.log('ML client: received', data);
    return {
      prediction: Number(data.prediction) || 0,
      confidence: Number(data.confidence) || 0,
    };
  } catch {
    console.error('ML client: request failed or timed out, returning neutral');
    return { prediction: 0, confidence: 0 };
  }
}
