// api/memory-load.js
// Vercel serverless function — proxies memory load request to VPS
// Called by App.jsx: GET /api/memory-load?sessionId=asia

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  const VPS_URL = "http://187.77.222.237:3001";
  const SAGE_SECRET = process.env.VITE_SAGE_SECRET || "sage-ladypie-2025";

  try {
    const response = await fetch(`${VPS_URL}/memory/${sessionId}`, {
      headers: { "x-sage-secret": SAGE_SECRET },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "VPS error" });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    // VPS unreachable — return not found so app falls back to localStorage
    return res.status(200).json({ found: false, data: null });
  }
}
