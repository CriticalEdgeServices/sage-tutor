const ALLOWED_ORIGIN = "https://www.sage-ai-4-ladypie.com";

export default async function handler(req, res) {
  // Block non-POST
  if (req.method !== "POST") return res.status(405).end();

  // Block requests not coming from your domain
  const origin = req.headers.origin || req.headers.referer || "";
  if (!origin.startsWith(ALLOWED_ORIGIN)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Basic body validation
  const { model, messages, system, max_tokens } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, messages, system, max_tokens }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic error:", data);
      return res.status(response.status).json({ error: data?.error?.message || "API error" });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
