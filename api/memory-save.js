// api/memory-save.js
// Vercel serverless function — proxies memory save request to VPS
// Called by App.jsx: POST /api/memory-save

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sessionId, data } = req.body;
  if (!sessionId || !data) {
    return res.status(400).json({ error: "Missing sessionId or data" });
  }

  const VPS_URL = "http://187.77.222.237:3001";
  const SAGE_SECRET = process.env.VITE_SAGE_SECRET || "sage-ladypie-2025";

  try {
    const response = await fetch(`${VPS_URL}/memory/${sessionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sage-secret": SAGE_SECRET,
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "VPS error" });
    }

    const result = await response.json();
    return res.status(200).json(result);

  } catch (err) {
    // VPS unreachable — silent fail, localStorage still has the data
    return res.status(200).json({ success: false, error: "VPS unreachable" });
  }
}
