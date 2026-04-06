import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════
//  SAGE v4 — Personalized Multi-Agent Tutor
//  Features: Expanded hobbies · Asia's palette · Real-world rewards
//            File uploads · Scaffolded answers · Richer memory
//            Cloud sync: VPS → localStorage fallback
// ═══════════════════════════════════════════════════════════════════

const MEMORY_KEY = "sage_v4_memory";
const VPS_URL = "https://187.77.222.237:3001"; // direct IP — swap for domain if added later
const SAGE_SECRET = import.meta.env.VITE_SAGE_SECRET || "sage-ladypie-2025";

// ─── Memory helpers (cloud + local) ──────────────────────────────
function getSessionId(profile) {
  // Use the student's name as session ID — any device with same name shares memory
  return (profile?.name || "asia").toLowerCase().replace(/\s+/g, "_");
}

async function loadMemoryCloud(sessionId) {
  try {
    const res = await fetch(`http://187.77.222.237:3001/memory/${sessionId}`, {
      headers: { "x-sage-secret": SAGE_SECRET },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.found ? json.data : null;
  } catch {
    return null;
  }
}

async function saveMemoryCloud(sessionId, data) {
  try {
    await fetch(`http://187.77.222.237:3001/memory/${sessionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sage-secret": SAGE_SECRET,
      },
      body: JSON.stringify({ data }),
    });
  } catch {
    // Silent fail — localStorage is the fallback
  }
}

function loadMemoryLocal() {
  try { const r = localStorage.getItem(MEMORY_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}

function saveMemoryLocal(m) {
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(m)); } catch {}
}

// Load: try VPS first, fall back to localStorage
async function loadMemory(profile) {
  const sessionId = getSessionId(profile);
  const cloud = await loadMemoryCloud(sessionId);
  if (cloud) {
    saveMemoryLocal(cloud); // sync cloud → local
    return cloud;
  }
  return loadMemoryLocal();
}

// Save: write to both
async function saveMemory(m) {
  saveMemoryLocal(m);
  const sessionId = getSessionId(m.profile);
  await saveMemoryCloud(sessionId, m);
}

function initMemory(profile) {
  return {
    profile,
    sessionCount: 0,
    subjects: {},
    recentTopics: [],
    achievements: [],
    studyPoints: 0,
    unlockedRewards: [],
    personalNotes: [],
    stuckCount: {},
    createdAt: Date.now(),
  };
}

// ─── Color palette (Asia's vibe: red, black, pink, purple) ───────────
const C = {
  bg:          "#0a0008",
  bgCard:      "rgba(255,255,255,0.03)",
  bgInput:     "rgba(255,255,255,0.05)",
  border:      "rgba(255,255,255,0.08)",
  borderWarm:  "rgba(220,38,127,0.3)",
  pink:        "#f02d7a",
  pinkLight:   "#ff6eb0",
  pinkSoft:    "rgba(240,45,122,0.12)",
  purple:      "#9333ea",
  purpleLight: "#c084fc",
  purpleSoft:  "rgba(147,51,234,0.12)",
  red:         "#e11d48",
  redSoft:     "rgba(225,29,72,0.12)",
  textPrimary: "#fde8f0",
  textSec:     "#a0748a",
  textMuted:   "#4a2f3c",
  gradMain:    "linear-gradient(135deg, #e11d48, #9333ea)",
  gradWarm:    "linear-gradient(135deg, #f02d7a, #c084fc)",
  gradCool:    "linear-gradient(135deg, #9333ea, #e11d48)",
  white10:     "rgba(255,255,255,0.1)",
  white05:     "rgba(255,255,255,0.05)",
};

// ─── Achievements ─────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: "first_session",  label: "First Step 🌱",      desc: "Started your first session with Sage",         points: 10 },
  { id: "math_session",   label: "Number Cruncher 🔢",  desc: "Completed a math tutoring session",            points: 15 },
  { id: "essay_session",  label: "Wordsmith ✍️",        desc: "Worked through a writing assignment",          points: 15 },
  { id: "research_done",  label: "Deep Diver 🔬",       desc: "Used the research agent",                      points: 20 },
  { id: "three_sessions", label: "On a Roll 🔥",        desc: "3 sessions completed",                         points: 25 },
  { id: "ten_sessions",   label: "Dedicated 💪",        desc: "10 sessions — seriously impressive",           points: 50 },
  { id: "planner_used",   label: "Got Organized 📅",    desc: "Used the planner to sort your workload",       points: 15 },
];

// ─── Real-world reward tiers ─────────────────────────────────────────
const REWARD_TIERS = [
  {
    id: "tier1_crochet",
    label: "🧶 Crochet Pattern Unlock",
    threshold: 50,
    desc: "Sage picks a pattern matched to your skill level from Ravelry",
    category: "craft",
    mission: null,
  },
  {
    id: "tier2_icecream",
    label: "🍦 Ice Cream Mission",
    threshold: 100,
    desc: "Find a dessert spot near you and bring back the details.",
    category: "outing",
    mission: "Your mission: Find an ice cream or dessert spot near Cane Bay. Research it — bring back the name, address, hours, and what you'd order. Complete the mission and the outing is approved! 🍦",
  },
  {
    id: "tier3_movie",
    label: "🎬 Movie Night Mission",
    threshold: 175,
    desc: "Find a movie showing near you this weekend.",
    category: "outing",
    mission: "Mission: Find a movie showing near you this weekend. Tell me the theater, showtime, ticket price, and who you'd bring. Come back with the intel and movie night is yours! 🎬",
  },
  {
    id: "tier4_activity",
    label: "🌟 Sunday Adventure",
    threshold: 300,
    desc: "Plan a full Sunday activity — bowling, laser tag, escape room, anything.",
    category: "adventure",
    mission: "Big mission: Plan a Sunday adventure. Pick something fun — bowling, escape room, laser tag, arcade, hiking. Research: location, hours, cost, what to bring. Full plan = approved adventure! 🌟",
  },
  {
    id: "tier5_shopping",
    label: "🛍️ Craft Supply Run",
    threshold: 450,
    desc: "A craft supply trip — yarn, a Lego set, slime supplies, whatever you're into.",
    category: "shopping",
    mission: "You've earned a craft run! Make a specific list: exactly what you want, where to get it, total estimated cost. Bring me the plan and we'll make it happen 🛍️",
  },
];

const CROCHET_PATTERNS = [
  { name: "Beginner Granny Square",  url: "https://www.ravelry.com/patterns/search#craft=crochet&difficulty=1&sort=best" },
  { name: "Simple Amigurumi Animal", url: "https://www.ravelry.com/patterns/search#craft=crochet&difficulty=2&sort=best" },
  { name: "Cozy Slouchy Beanie",     url: "https://www.ravelry.com/patterns/search#craft=crochet&pc=hat&difficulty=2" },
  { name: "Market Bag / Tote",       url: "https://www.ravelry.com/patterns/search#craft=crochet&pc=bag&difficulty=2" },
];

const YOUTUBE_RESOURCES = {
  math:    ["3Blue1Brown (visual math magic)", "Professor Leonard (full algebra lectures)", "Khan Academy Math", "The Organic Chemistry Tutor"],
  science: ["CrashCourse Biology", "Kurzgesagt (stunning visuals)", "Khan Academy Science", "Amoeba Sisters"],
  history: ["CrashCourse World History", "CrashCourse US History", "Overly Sarcastic Productions"],
  english: ["CrashCourse Literature", "TED-Ed", "Ellen Brock (writing)", "Sheridan Voigt (essay structure)"],
  general: ["CrashCourse (any subject)", "Khan Academy", "TED-Ed", "Vsauce"],
};

// ─── Onboarding steps ────────────────────────────────────────────────
const ONBOARDING = [
  {
    id: "name", type: "text", placeholder: "Your name or nickname...",
    question: () => "Hey! Before we dive in, I actually want to get to know you. What's your name? (Nickname totally fine 😊)"
  },
  {
    id: "grade_feel", type: "choice",
    question: (a) => `Nice to meet you, ${a.name}! Real talk — how are you feeling about school right now?`,
    options: [
      { value: "overwhelmed", label: "😵 Pretty overwhelmed honestly" },
      { value: "behind",      label: "📉 Behind and stressed about catching up" },
      { value: "okay",        label: "🤷 Okay I guess, could be better" },
      { value: "ready",       label: "💪 Ready to actually get stuff done" },
    ]
  },
  {
    id: "fav_subject", type: "choice",
    question: () => "Every student has at least one subject that's secretly kind of interesting. Which is yours?",
    options: [
      { value: "math",      label: "🔢 Math — numbers actually make sense to me" },
      { value: "english",   label: "📖 English / Writing" },
      { value: "science",   label: "🔬 Science" },
      { value: "history",   label: "📜 History" },
      { value: "art_music", label: "🎨 Art or Music" },
      { value: "none",      label: "😅 Honestly none of them right now" },
    ]
  },
  {
    id: "hard_subject", type: "choice",
    question: () => "And the one that makes you want to close the laptop?",
    options: [
      { value: "math",    label: "🔢 Math — it's just not clicking" },
      { value: "english", label: "📖 English / Essays are painful" },
      { value: "science", label: "🔬 Science" },
      { value: "history", label: "📜 History — way too much memorizing" },
      { value: "all",     label: "😭 All of them honestly" },
    ]
  },
  {
    id: "learning_style", type: "choice",
    question: () => "When you're learning something new, what actually works for you?",
    options: [
      { value: "examples",    label: "💡 Show me an example first, then explain" },
      { value: "stepbystep",  label: "📋 Walk me through it one step at a time" },
      { value: "explain_why", label: "🤔 Tell me WHY it works before the HOW" },
      { value: "just_try",    label: "🚀 Let me try it, help when I get stuck" },
    ]
  },
  {
    id: "hobbies", type: "multi",
    question: () => "What do you actually enjoy when school isn't happening? (Pick all that apply 👇)",
    options: [
      { value: "crochet",  label: "🧶 Crocheting" },
      { value: "anime",    label: "✨ Watching anime" },
      { value: "lego",     label: "🧱 Building Legos" },
      { value: "slime",    label: "🫧 Making slime" },
      { value: "drawing",  label: "🎨 Drawing / art" },
      { value: "music",    label: "🎵 Music / dancing" },
      { value: "gaming",   label: "🎮 Gaming" },
      { value: "reading",  label: "📚 Reading / writing" },
      { value: "outdoors", label: "🌿 Outdoors / sports" },
    ]
  },
  {
    id: "anime_shows", type: "text", skippable: true,
    placeholder: "e.g. Demon Slayer, My Hero Academia, Jujutsu Kaisen...",
    question: (a) => {
      const h = Array.isArray(a.hobbies) ? a.hobbies : [];
      return h.includes("anime") ? "What anime are you into right now? I'll use this for references when it fits 😄" : null;
    },
    skip_if: (a) => { const h = Array.isArray(a.hobbies) ? a.hobbies : []; return !h.includes("anime"); }
  },
  {
    id: "crochet_level", type: "choice",
    question: (a) => {
      const h = Array.isArray(a.hobbies) ? a.hobbies : [];
      return h.includes("crochet") ? "How long have you been crocheting?" : null;
    },
    skip_if: (a) => { const h = Array.isArray(a.hobbies) ? a.hobbies : []; return !h.includes("crochet"); },
    options: [
      { value: "beginner",     label: "🌱 Still learning the basics" },
      { value: "intermediate", label: "🧶 I can follow most patterns" },
      { value: "advanced",     label: "⭐ Complex patterns — I love it" },
    ]
  },
  {
    id: "lego_theme", type: "text", skippable: true,
    placeholder: "e.g. Technic, Star Wars, City, Architecture...",
    question: (a) => {
      const h = Array.isArray(a.hobbies) ? a.hobbies : [];
      return h.includes("lego") ? "What kind of Lego sets are you into? Technic? Star Wars? Something specific?" : null;
    },
    skip_if: (a) => { const h = Array.isArray(a.hobbies) ? a.hobbies : []; return !h.includes("lego"); }
  },
  {
    id: "one_thing", type: "text", skippable: true,
    placeholder: "Whatever you want me to know... or just skip ❤️",
    question: () => "Last one, I promise. Is there anything you wish people just understood about you? (Totally optional)"
  },
];

// ─── Agent Prompts ────────────────────────────────────────────────────

function buildHobbyContext(p) {
  const hobbies = Array.isArray(p.hobbies) ? p.hobbies : [p.hobbies].filter(Boolean);
  const parts = [];
  if (hobbies.includes("crochet")) parts.push(`crocheting (level: ${p.crochet_level || "unknown"})`);
  if (hobbies.includes("anime")) parts.push(`anime${p.anime_shows ? ` — currently: ${p.anime_shows}` : ""}`);
  if (hobbies.includes("lego")) parts.push(`Legos${p.lego_theme ? ` (${p.lego_theme})` : ""}`);
  if (hobbies.includes("slime")) parts.push("making slime");
  if (hobbies.includes("drawing")) parts.push("drawing/art");
  if (hobbies.includes("gaming")) parts.push("gaming");
  if (hobbies.includes("music")) parts.push("music/dancing");
  if (hobbies.includes("reading")) parts.push("reading/writing");
  return parts.join(", ") || "various hobbies";
}

function buildOrchestratorPrompt(memory) {
  const p = memory?.profile || {};
  const hobbyCtx = buildHobbyContext(p);
  return `You are the invisible ORCHESTRATOR for Sage, a tutor AI built for ${p.name || "a student"}, a 10th grader at Cane Bay High School, South Carolina.

STUDENT SNAPSHOT:
- Name: ${p.name || "?"}, School feel: ${p.grade_feel || "?"}, Fav: ${p.fav_subject || "?"}, Hard: ${p.hard_subject || "?"}
- Learning style: ${p.learning_style || "?"}, Hobbies: ${hobbyCtx}
- Sessions: ${memory?.sessionCount || 0}, Study points: ${memory?.studyPoints || 0}

OUTPUT ONLY valid JSON — no explanation, no preamble:
{
  "agent": "tutor" | "research" | "emotional" | "planner" | "casual",
  "subject": "math" | "english" | "science" | "history" | "general" | null,
  "urgency": "high" | "medium" | "low",
  "context_note": "short note for the agent",
  "needs_humor": true | false,
  "suggest_video": true | false,
  "hobby_bridge": true | false
}

ROUTING RULES:
- "tutor" → homework, concept help, problem solving, practice, test prep
- "research" → essays needing sources, current events, multi-angle topics
- "emotional" → frustration, stress, mentions of mom, feeling worthless, overwhelmed
- "planner" → prioritization, "what do I do first", scheduling, too much due
- "casual" → chatting, not homework, personal talk, hobbies, life stuff
- needs_humor: true ~30% of tutor/planner, higher if she seems stressed, NEVER for emotional
- suggest_video: true when visual explanation would significantly help
- hobby_bridge: true when there's a natural way to connect topic to her hobbies`;
}

function buildTutorPrompt(memory, subject, needsHumor, contextNote, suggestVideo, hobbyBridge) {
  const p = memory?.profile || {};
  const name = p.name || "there";
  const style = p.learning_style || "stepbystep";
  const hobbyCtx = buildHobbyContext(p);
  const channels = (YOUTUBE_RESOURCES[subject] || YOUTUBE_RESOURCES.general).join(", ");
  const hobbies = Array.isArray(p.hobbies) ? p.hobbies : [p.hobbies].filter(Boolean);

  const styleGuide = {
    examples:    "Lead with a concrete worked example BEFORE the rule. Show first, explain second.",
    stepbystep:  "Break everything into clearly numbered steps. Never skip one — even obvious steps.",
    explain_why: "Start with WHY this concept exists and why it matters. Then show HOW to apply it.",
    just_try:    "Give a minimal hint. Ask what she thinks the next step is. Let her drive — help when stuck.",
  }[style] || "Be clear, patient, and check in frequently.";

  const scaffoldingRules = `
ANSWER SCAFFOLDING — GRADUATED SUPPORT:
Never leave her stuck for more than 2 exchanges. Escalate through these levels naturally:
  Level 1 (first response): Give a hint or guiding question. Nudge her toward the answer.
  Level 2 (if still stuck): Provide a worked example of a SIMILAR problem, then ask her to apply it.
  Level 3 (if still stuck): Show the full solution clearly, step by step. Explain WHY each step works.
  Level 4 (after any answer): Quick follow-up — "Does that make sense? Want to try a similar one?"

If the topic is clearly too broad: "This one's a lot to unpack. Let me just show you how it works and then we'll practice together." Give the full explanation.`;

  const humorGuide = needsHumor ? `
DAD HUMOR IS ON 🎉 — ONE groan-worthy pun per response, woven in naturally. Self-aware and brief.
Make it relevant to her hobbies if you can — anime, Lego, slime, crochet are all fair game.
One and done. Never forced.` : "";

  let hobbyGuide = "";
  if (hobbyBridge) {
    const bridges = [];
    if (hobbies.includes("crochet") && p.crochet_level !== "not_really") {
      bridges.push("Crocheting: Math patterns ↔ stitch counts/repeats. Fractions ↔ yarn weight. Geometry ↔ increases/decreases.");
    }
    if (hobbies.includes("anime") && p.anime_shows) {
      bridges.push(`Anime (${p.anime_shows}): Use character arcs for narrative structure, power systems for scientific principles, training arcs for concept mastery.`);
    }
    if (hobbies.includes("lego")) {
      bridges.push("Lego: Engineering ↔ Technic mechanisms. Geometry ↔ spatial building. Physics ↔ structural stability.");
    }
    if (hobbies.includes("slime")) {
      bridges.push("Slime: Chemistry ↔ polymer reactions, viscosity, non-Newtonian fluids. Great for science analogies.");
    }
    if (bridges.length > 0) {
      hobbyGuide = `\nHOBBY BRIDGE — use ONE of these naturally if it fits:\n${bridges.join("\n")}`;
    }
  }

  const videoGuide = suggestVideo ? `
VIDEO SUGGESTION — add at the end:
"🎥 This might click better visually — try searching YouTube for: [specific search phrase]
Good channels: ${channels}"` : "";

  return `You are Sage, a warm, brilliant tutor for ${name} — 10th grade, Cane Bay High School, SC.
She's been through a lot and is working hard to catch up. Guide, support, believe in her.

CONTEXT: ${contextNote || "Regular tutoring session."}
HOBBIES: ${hobbyCtx}
TEACHING STYLE FOR ${name.toUpperCase()}: ${styleGuide}
${scaffoldingRules}
${humorGuide}
${hobbyGuide}
${videoGuide}

ALWAYS:
- Acknowledge frustration with ONE sentence before continuing
- Celebrate when she gets something, even small wins
- Never talk down to her — she's smart, she's just been having a hard time`;
}

function buildResearchPrompt(memory) {
  const p = memory?.profile || {};
  return `You are Sage's RESEARCH AGENT for ${p.name || "a 10th grade student"} at Cane Bay High School.

For deep research tasks — essays, projects, multi-source questions:
1. Understand the full scope of the assignment first
2. Break the topic into 3-5 key questions worth exploring
3. Provide organized, clearly sourced information
4. Guide her toward forming her OWN thesis — don't write it for her
5. Suggest structure: how to organize the response, what each section should do
6. At the end, suggest 2 YouTube searches that would help her understand the topic visually

Help her think, not just collect. Ask "what angle interests you most?" before diving in.`;
}

function buildEmotionalPrompt(memory) {
  const p = memory?.profile || {};
  const name = p.name || "she";
  return `You are Sage's EMOTIONAL SUPPORT mode for ${name}.

${name} is 16. She lost her mother in early 2025. Her family has moved many times. She is in counseling, which is great. She is trying.

When she's overwhelmed, sad, or brings up something hard:
1. Acknowledge first. Don't rush to fix. "That sounds really heavy" is sometimes the whole response needed.
2. Be real. Not therapy-speak. Like a caring older sister or mentor.
3. If she mentions her mom, pause there. Honor it. Don't rush past.
4. Find ONE small, manageable next step — not a list. One thing.
5. Remind her gently that falling behind does not equal being behind in terms of her worth or her future.
6. If things sound serious, gently encourage her to talk to her counselor or a trusted adult.
7. End by asking: "What would feel most helpful right now?"

You are not her therapist. You are someone genuinely in her corner.`;
}

function buildPlannerPrompt(memory) {
  const p = memory?.profile || {};
  return `You are Sage's PLANNER mode for ${p.name || "a student"} who needs help organizing her work.

She tends to get overwhelmed seeing the full pile. Your approach:
1. Have her list everything that's due — get it all out
2. Sort it: due date then grade impact then difficulty
3. Help her identify the ONE thing to start with (not the biggest, the most strategic)
4. Estimate time for each item honestly
5. Build a "today" list of 2-3 max — nothing more
6. Acknowledge that making a plan when overwhelmed is genuinely hard and she did it

Keep the tone calm, organized, quietly encouraging. One light dad joke is fine if the moment calls for it.`;
}

function buildCasualPrompt(memory) {
  const p = memory?.profile || {};
  const name = p.name || "there";
  const hobbyCtx = buildHobbyContext(p);
  const hobbies = Array.isArray(p.hobbies) ? p.hobbies : [p.hobbies].filter(Boolean);

  const hobbyLines = [];
  if (hobbies.includes("crochet")) hobbyLines.push(`- She crochets (${p.crochet_level || "some experience"}). Ask what she's making, talk patterns, suggest ideas.`);
  if (hobbies.includes("anime")) hobbyLines.push(`- She's into anime${p.anime_shows ? ` — currently ${p.anime_shows}` : ""}. You can reference characters, ask what she thinks of the plot, share genuine enthusiasm.`);
  if (hobbies.includes("lego")) hobbyLines.push(`- She builds Legos${p.lego_theme ? ` (into ${p.lego_theme})` : ""}. Ask about current builds, new sets she wants.`);
  if (hobbies.includes("slime")) hobbyLines.push(`- She makes slime. Ask what recipes she's tried, what textures she likes making.`);
  if (hobbies.includes("drawing")) hobbyLines.push(`- She draws / makes art. Ask what she's been creating lately.`);
  if (hobbies.includes("gaming")) hobbyLines.push(`- She games. Ask what she's playing.`);
  if (hobbies.includes("music")) hobbyLines.push(`- She's into music / dancing. Ask what she's been listening to.`);

  return `You are Sage in CASUAL / COMPANION mode with ${name}.

She's not doing homework right now — she's just talking. Be real, warm, genuinely interested.

HER HOBBIES: ${hobbyCtx}
${hobbyLines.join("\n")}

Be like a fun older friend who actually cares about what she's into, not a tutor pretending to be cool.
If she mentions a boy she likes, be warm and appropriately delighted.
If she naturally transitions back to homework, follow her lead.
You can be funny, curious, mildly opinionated. You know everything but don't show off about it.`;
}

// ─── API helper ───────────────────────────────────────────────────────
async function callClaude(system, messages, max = 1300) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: max, system, messages }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `API error ${res.status}`); }
  const d = await res.json();
  return d.content?.find(b => b.type === "text")?.text || "";
}

const fileToBase64 = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result.split(",")[1]);
  r.onerror = rej;
  r.readAsDataURL(file);
});

// ─── Achievement helpers ──────────────────────────────────────────────
function checkAchievements(memory, trigger) {
  const earned = [...(memory.achievements || [])];
  const newOnes = [];
  let points = memory.studyPoints || 0;
  const unlocked = [...(memory.unlockedRewards || [])];
  const newRewards = [];

  const check = (id, condition) => {
    if (condition && !earned.includes(id)) {
      const a = ACHIEVEMENTS.find(x => x.id === id);
      if (a) { newOnes.push(a); earned.push(id); points += a.points; }
    }
  };

  check("first_session",  memory.sessionCount >= 1);
  check("three_sessions", memory.sessionCount >= 3);
  check("ten_sessions",   memory.sessionCount >= 10);
  check("math_session",   trigger === "math");
  check("essay_session",  trigger === "english");
  check("research_done",  trigger === "research");
  check("planner_used",   trigger === "planner");

  for (const tier of REWARD_TIERS) {
    if (points >= tier.threshold && !unlocked.includes(tier.id)) {
      unlocked.push(tier.id);
      newRewards.push(tier);
    }
  }

  return { newAchievements: newOnes, newRewards, updatedEarned: earned, updatedPoints: points, updatedUnlocked: unlocked };
}

// ─── Sub-components ───────────────────────────────────────────────────

const AGENT_BADGES = {
  tutor:     { label: "Tutor",         color: C.pink,        icon: "📚" },
  research:  { label: "Research",      color: C.purpleLight, icon: "🔬" },
  emotional: { label: "Here for you",  color: C.pinkLight,   icon: "💙" },
  planner:   { label: "Planner",       color: "#34d399",     icon: "📅" },
  casual:    { label: "Just chatting", color: C.red,         icon: "✨" },
};

function AgentBadge({ agent }) {
  const b = AGENT_BADGES[agent] || AGENT_BADGES.tutor;
  return (
    <span style={{ fontSize: "11px", padding: "2px 10px", borderRadius: "20px",
      background: `${b.color}18`, border: `1px solid ${b.color}40`, color: b.color,
      fontFamily: "monospace", letterSpacing: "0.04em" }}>
      {b.icon} {b.label}
    </span>
  );
}

function AchievementToast({ achievement, onDismiss }) {
  useEffect(() => { const t = setTimeout(onDismiss, 5500); return () => clearTimeout(t); }, []);
  return (
    <div onClick={onDismiss} style={{
      position: "fixed", bottom: "90px", right: "20px", zIndex: 100,
      background: C.gradMain, borderRadius: "16px", padding: "16px 20px", maxWidth: "290px",
      boxShadow: "0 8px 40px rgba(225,29,72,0.35)", animation: "slideIn 0.4s ease",
      cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)"
    }}>
      <div style={{ fontSize: "24px", marginBottom: "4px" }}>🏆</div>
      <div style={{ color: "white", fontWeight: "700", fontSize: "14px", marginBottom: "2px",
        fontFamily: "monospace" }}>{achievement.label}</div>
      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", lineHeight: "1.4" }}>{achievement.desc}</div>
    </div>
  );
}

function RewardModal({ reward, onClose }) {
  const isCraft = reward.category === "craft";
  const pattern = isCraft ? CROCHET_PATTERNS[Math.floor(Math.random() * CROCHET_PATTERNS.length)] : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{
        background: "linear-gradient(145deg, #1a0014, #0d001a)",
        border: `1px solid ${C.borderWarm}`, borderRadius: "24px",
        padding: "44px 38px", maxWidth: "460px", width: "100%", textAlign: "center",
        boxShadow: "0 24px 80px rgba(225,29,72,0.25), 0 0 0 1px rgba(240,45,122,0.1)",
        position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)",
          width: "200px", height: "200px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(225,29,72,0.2) 0%, transparent 70%)",
          pointerEvents: "none" }} />

        <div style={{ fontSize: "56px", marginBottom: "18px" }}>{reward.label.split(" ")[0]}</div>
        <h2 style={{ color: C.textPrimary, fontSize: "22px", fontWeight: "700", marginBottom: "8px",
          fontFamily: "monospace", letterSpacing: "-0.02em" }}>Reward Unlocked!</h2>
        <p style={{ color: C.textSec, fontSize: "15px", lineHeight: "1.7", marginBottom: "24px",
          fontFamily: "Georgia, serif", fontStyle: "italic" }}>{reward.desc}</p>

        {isCraft && pattern && (
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: "14px", padding: "18px", marginBottom: "24px" }}>
            <div style={{ color: C.textPrimary, fontWeight: "600", fontSize: "16px", marginBottom: "6px" }}>
              {pattern.name}
            </div>
            <a href={pattern.url} target="_blank" rel="noopener noreferrer" style={{
              display: "inline-block", background: C.gradMain,
              color: "white", borderRadius: "10px", padding: "10px 22px",
              fontSize: "13px", textDecoration: "none", fontWeight: "600",
              fontFamily: "monospace", marginTop: "8px"
            }}>Browse Patterns →</a>
          </div>
        )}

        {reward.mission && (
          <div style={{ background: C.pinkSoft, border: `1px solid ${C.borderWarm}`,
            borderRadius: "14px", padding: "18px", marginBottom: "24px", textAlign: "left" }}>
            <div style={{ color: C.pink, fontSize: "11px", fontFamily: "monospace",
              marginBottom: "8px", letterSpacing: "0.08em" }}>YOUR MISSION</div>
            <p style={{ color: C.textPrimary, fontSize: "15px", lineHeight: "1.7", margin: 0,
              fontFamily: "Georgia, serif", fontStyle: "italic" }}>{reward.mission}</p>
          </div>
        )}

        <button onClick={onClose} style={{
          background: "none", border: `1px solid ${C.border}`, borderRadius: "10px",
          padding: "10px 24px", color: C.textSec, cursor: "pointer",
          fontSize: "14px", fontFamily: "Georgia, serif", fontStyle: "italic"
        }}>Keep studying 💪</button>
      </div>
    </div>
  );
}

function StatsBar({ memory }) {
  const pts = memory?.studyPoints || 0;
  const nextTier = REWARD_TIERS.find(t => pts < t.threshold);
  const threshold = nextTier?.threshold || REWARD_TIERS[REWARD_TIERS.length - 1].threshold;
  const pct = Math.min((pts / threshold) * 100, 100);
  const sessions = memory?.sessionCount || 0;
  const unlockedCount = (memory?.unlockedRewards || []).length;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px",
      padding: "7px 16px", background: "rgba(225,29,72,0.04)",
      borderBottom: "1px solid rgba(225,29,72,0.1)", fontSize: "11px",
      fontFamily: "monospace" }}>
      <span style={{ color: C.textMuted }}>sessions: <span style={{ color: C.pink }}>{sessions}</span></span>
      <span style={{ color: C.textMuted }}>pts: <span style={{ color: C.pink }}>{pts}</span></span>
      {unlockedCount > 0 && <span style={{ color: C.textMuted }}>rewards: <span style={{ color: C.pinkLight }}>{unlockedCount}</span></span>}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: C.textMuted, whiteSpace: "nowrap" }}>
          {nextTier ? `next: ${nextTier.label.split(" ").slice(0, 2).join(" ")}` : "🌟 all tiers!"}
        </span>
        <div style={{ flex: 1, height: "3px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: C.gradMain,
            borderRadius: "2px", transition: "width 0.6s ease" }} />
        </div>
        <span style={{ color: C.textMuted, whiteSpace: "nowrap" }}>
          {nextTier ? `${pts}/${threshold}` : "✨"}
        </span>
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "22px", gap: "10px", alignItems: "flex-end" }}>
      {!isUser && (
        <div style={{ width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0,
          background: C.gradMain, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "16px", boxShadow: "0 2px 12px rgba(225,29,72,0.4)" }}>✦</div>
      )}
      <div style={{ maxWidth: "76%", display: "flex", flexDirection: "column", gap: "5px" }}>
        {!isUser && msg.agent && <div><AgentBadge agent={msg.agent} /></div>}
        {msg.images?.map((src, i) => (
          <img key={i} src={src} alt="" style={{ maxWidth: "220px", borderRadius: "10px",
            border: `1px solid ${C.border}` }} />
        ))}
        {msg.fileNames?.map((name, i) => (
          <span key={i} style={{ background: C.pinkSoft, border: `1px solid ${C.borderWarm}`,
            borderRadius: "8px", padding: "3px 10px", fontSize: "12px", color: C.pinkLight }}>📄 {name}</span>
        ))}
        {msg.text && (
          <div style={{
            background: isUser ? C.pinkSoft : C.bgCard,
            border: isUser ? "1px solid rgba(240,45,122,0.3)" : `1px solid ${C.border}`,
            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            padding: "13px 18px", color: isUser ? C.textPrimary : "#e8dde8",
            fontSize: "15px", lineHeight: "1.75", whiteSpace: "pre-wrap", wordBreak: "break-word",
            fontFamily: "Georgia, 'Times New Roman', serif"
          }}>{msg.text}</div>
        )}
      </div>
      {isUser && (
        <div style={{ width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0,
          background: C.gradCool, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", boxShadow: "0 2px 12px rgba(147,51,234,0.4)" }}>✿</div>
      )}
    </div>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [textInput, setTextInput] = useState("");
  const [multiSel, setMultiSel] = useState([]);
  const [fading, setFading] = useState(false);

  function findNextStep(fromStep, currentAnswers) {
    let next = fromStep + 1;
    while (next < ONBOARDING.length) {
      const s = ONBOARDING[next];
      if (s.skip_if && s.skip_if(currentAnswers)) { next++; continue; }
      if (s.question) {
        const q = s.question(currentAnswers);
        if (q === null) { next++; continue; }
      }
      break;
    }
    return next;
  }

  const cur = ONBOARDING[step];
  const q = cur.question ? cur.question(answers) : "";

  function advance(value) {
    const na = { ...answers, [cur.id]: value };
    setAnswers(na);
    setTextInput("");
    setMultiSel([]);
    setFading(true);
    setTimeout(() => {
      setFading(false);
      const next = findNextStep(step, na);
      if (next >= ONBOARDING.length) onComplete(na);
      else setStep(next);
    }, 280);
  }

  function toggleMulti(val) {
    setMultiSel(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  }

  const pct = (step / ONBOARDING.length) * 100;

  return (
    <div style={{ minHeight: "100vh", background: C.bg,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "Georgia, serif",
      backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(225,29,72,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(147,51,234,0.06) 0%, transparent 60%)"
    }}>
      <style>{`@keyframes pulse{0%,100%{transform:scale(.7);opacity:.4}50%{transform:scale(1);opacity:1}}@keyframes slideIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

      <div style={{ width: "100%", maxWidth: "520px", marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ color: C.textMuted, fontSize: "12px", fontFamily: "monospace" }}>getting to know you</span>
          <span style={{ color: C.textMuted, fontSize: "12px", fontFamily: "monospace" }}>{step + 1} / {ONBOARDING.length}</span>
        </div>
        <div style={{ height: "3px", background: "rgba(255,255,255,0.05)", borderRadius: "2px" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: C.gradMain, borderRadius: "2px", transition: "width 0.4s ease" }} />
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: "520px",
        background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: "22px",
        padding: "38px 34px",
        opacity: fading ? 0 : 1, transform: fading ? "translateY(10px)" : "translateY(0)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
      }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: C.gradMain,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "19px", marginBottom: "22px", boxShadow: "0 4px 20px rgba(225,29,72,0.3)" }}>✦</div>

        <p style={{ color: C.textPrimary, fontSize: "19px", lineHeight: "1.65", marginBottom: "28px",
          fontStyle: "italic" }}>{q}</p>

        {cur.type === "choice" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {cur.options.map(o => (
              <button key={o.value} onClick={() => advance(o.value)} style={{
                background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
                borderRadius: "12px", padding: "12px 16px", color: C.textPrimary,
                fontSize: "15px", cursor: "pointer", textAlign: "left",
                transition: "all 0.15s ease", fontFamily: "Georgia, serif", fontStyle: "italic" }}
                onMouseEnter={e => { e.currentTarget.style.background = C.pinkSoft; e.currentTarget.style.borderColor = C.borderWarm; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = C.border; }}
              >{o.label}</button>
            ))}
          </div>
        )}

        {cur.type === "multi" && (
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "18px" }}>
              {cur.options.map(o => {
                const sel = multiSel.includes(o.value);
                return (
                  <button key={o.value} onClick={() => toggleMulti(o.value)} style={{
                    background: sel ? C.pinkSoft : "rgba(255,255,255,0.03)",
                    border: `1px solid ${sel ? C.pink : C.border}`,
                    borderRadius: "10px", padding: "9px 14px", color: sel ? C.pinkLight : C.textPrimary,
                    fontSize: "14px", cursor: "pointer", transition: "all 0.15s ease",
                    fontFamily: "Georgia, serif", fontStyle: "italic"
                  }}>{o.label}</button>
                );
              })}
            </div>
            <button
              disabled={multiSel.length === 0}
              onClick={() => multiSel.length > 0 && advance(multiSel)}
              style={{
                background: multiSel.length > 0 ? C.gradMain : "rgba(255,255,255,0.05)",
                border: "none", borderRadius: "12px", padding: "12px 24px",
                color: "white", fontSize: "15px", cursor: multiSel.length > 0 ? "pointer" : "not-allowed",
                fontFamily: "Georgia, serif", fontStyle: "italic",
                opacity: multiSel.length > 0 ? 1 : 0.4, transition: "all 0.2s"
              }}>
              Continue → {multiSel.length > 0 && `(${multiSel.length} selected)`}
            </button>
          </div>
        )}

        {cur.type === "text" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            <input autoFocus type="text" value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && textInput.trim() && advance(textInput.trim())}
              placeholder={cur.placeholder} style={{
                background: C.bgInput, border: `1px solid ${C.border}`,
                borderRadius: "12px", padding: "12px 15px", color: C.textPrimary,
                fontSize: "15px", outline: "none", fontFamily: "Georgia, serif",
                fontStyle: "italic", width: "100%", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: "9px" }}>
              <button onClick={() => textInput.trim() && advance(textInput.trim())} style={{
                flex: 1, background: C.gradMain, border: "none", borderRadius: "10px",
                padding: "11px", color: "white", fontSize: "15px", cursor: "pointer",
                fontFamily: "Georgia, serif", fontStyle: "italic"
              }}>Continue →</button>
              {cur.skippable && (
                <button onClick={() => advance("[skipped]")} style={{
                  background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
                  borderRadius: "10px", padding: "11px 16px",
                  color: C.textMuted, fontSize: "14px", cursor: "pointer",
                  fontFamily: "Georgia, serif"
                }}>Skip</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function SageV4() {
  const [screen, setScreen]           = useState("loading");
  const [memory, setMemory]           = useState(null);
  const [messages, setMessages]       = useState([]);
  const [apiHistory, setApiHistory]   = useState([]);
  const [input, setInput]             = useState("");
  const [files, setFiles]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [error, setError]             = useState("");
  const [toasts, setToasts]           = useState([]);
  const [pendingReward, setPendingReward] = useState(null);

  const bottomRef   = useRef(null);
  const fileRef     = useRef(null);
  const textareaRef = useRef(null);

  // ─── Boot: check localStorage first for profile name, then load cloud ──
  useEffect(() => {
    async function boot() {
      // Try localStorage first to get the profile (for session ID)
      const local = loadMemoryLocal();
      if (local?.profile) {
        // We have a profile — try to load from cloud, fall back to local
        const mem = await loadMemory(local.profile);
        setMemory(mem);
        setScreen("chat");
      } else {
        setScreen("onboarding");
      }
    }
    boot();
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  useEffect(() => {
    if (screen !== "chat" || messages.length > 0 || !memory) return;
    doGreeting(memory);
  }, [screen, memory]);

  async function doGreeting(mem) {
    const p = mem.profile;
    const hobbies = Array.isArray(p.hobbies) ? p.hobbies.join(", ") : (p.hobbies || "various things");
    const isReturn = mem.sessionCount > 1;
    const prompt = isReturn
      ? `You are Sage. ${p.name} is back for session ${mem.sessionCount}. Warm welcome-back, 2-3 sentences. Reference her hobbies: ${hobbies}${p.anime_shows ? `, watching ${p.anime_shows}` : ""}. End by asking what she's working on. One quick dad joke — try to tie it to one of her hobbies if you can.`
      : `You are Sage. ${p.name || "A student"} just set up their profile. Warm personal first greeting (3-4 sentences). She feels "${p.grade_feel}" about school, likes ${p.fav_subject}, finds ${p.hard_subject} hard. Hobbies: ${hobbies}${p.anime_shows ? `. Currently watching: ${p.anime_shows}` : ""}${p.lego_theme ? `. Into ${p.lego_theme} Legos` : ""}. Reassure her she's in the right place, no judgment. End by asking what to tackle first. One dad joke — make it hobby-related if possible.`;
    setLoading(true);
    try {
      const text = await callClaude(prompt, [{ role: "user", content: [{ type: "text", text: "Hello!" }] }]);
      setMessages([{ role: "assistant", text, agent: "tutor" }]);
      setApiHistory([
        { role: "user", content: [{ type: "text", text: "Hello!" }] },
        { role: "assistant", content: [{ type: "text", text }] }
      ]);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleOnboarding(profile) {
    const mem = initMemory(profile);
    mem.sessionCount = 1;
    await saveMemory(mem);
    setMemory(mem);
    setScreen("chat");
  }

  async function handleSend() {
    if ((!input.trim() && files.length === 0) || loading) return;
    const userText = input.trim();
    const attachedFiles = [...files];
    setInput(""); setFiles([]); setError("");

    const displayMsg = { role: "user", text: userText, images: [], fileNames: [] };
    const contentBlocks = [];

    for (const file of attachedFiles) {
      const b64 = await fileToBase64(file);
      if (file.type.startsWith("image/")) {
        contentBlocks.push({ type: "image", source: { type: "base64", media_type: file.type, data: b64 } });
        displayMsg.images.push(`data:${file.type};base64,${b64}`);
      } else if (file.type === "application/pdf") {
        contentBlocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } });
        displayMsg.fileNames.push(file.name);
      } else {
        const text = await file.text().catch(() => null);
        if (text) { contentBlocks.push({ type: "text", text: `[File: ${file.name}]\n${text}` }); displayMsg.fileNames.push(file.name); }
      }
    }
    if (userText) contentBlocks.push({ type: "text", text: userText });

    setMessages(prev => [...prev, displayMsg]);
    setLoading(true);

    try {
      const routeRaw = await callClaude(
        buildOrchestratorPrompt(memory),
        [{ role: "user", content: [{ type: "text", text: userText || "[files attached]" }] }],
        250
      );
      let route = { agent: "tutor", subject: "general", needs_humor: false, suggest_video: false, hobby_bridge: false, context_note: "" };
      try { const m = routeRaw.match(/\{[\s\S]*\}/); if (m) route = { ...route, ...JSON.parse(m[0]) }; } catch {}

      setActiveAgent(route.agent);

      let sys;
      if (route.agent === "research")       sys = buildResearchPrompt(memory);
      else if (route.agent === "emotional") sys = buildEmotionalPrompt(memory);
      else if (route.agent === "planner")   sys = buildPlannerPrompt(memory);
      else if (route.agent === "casual")    sys = buildCasualPrompt(memory);
      else sys = buildTutorPrompt(memory, route.subject, route.needs_humor, route.context_note, route.suggest_video, route.hobby_bridge);

      const newHist = [...apiHistory, { role: "user", content: contentBlocks }];
      const reply = await callClaude(sys, newHist, 1400);

      const asstMsg = { role: "assistant", content: [{ type: "text", text: reply }] };
      setApiHistory([...newHist, asstMsg]);
      setMessages(prev => [...prev, { role: "assistant", text: reply, agent: route.agent }]);

      const updMem = { ...memory };
      updMem.sessionCount = (updMem.sessionCount || 0) + 1;
      if (route.subject && route.subject !== "general") {
        updMem.subjects[route.subject] = updMem.subjects[route.subject] || { sessions: 0 };
        updMem.subjects[route.subject].sessions += 1;
        updMem.recentTopics = [route.subject, ...((updMem.recentTopics || []).filter(t => t !== route.subject))].slice(0, 8);
      }

      const { newAchievements, newRewards, updatedEarned, updatedPoints, updatedUnlocked } =
        checkAchievements(updMem, route.agent === "research" ? "research" : route.subject);
      updMem.achievements = updatedEarned;
      updMem.studyPoints = updatedPoints;
      updMem.unlockedRewards = updatedUnlocked;

      await saveMemory(updMem);
      setMemory(updMem);

      if (newAchievements.length > 0) setToasts(prev => [...prev, ...newAchievements]);
      if (newRewards.length > 0) setPendingReward(newRewards[0]);

    } catch(e) { setError(e.message || "Something went wrong."); }
    finally { setLoading(false); setActiveAgent(null); }
  }

  function handleKeyDown(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }

  async function reset() {
    if (!confirm("Reset Sage completely? This clears all memory and achievements.")) return;
    localStorage.removeItem(MEMORY_KEY);
    setMemory(null); setMessages([]); setApiHistory([]);
    setScreen("onboarding");
  }

  // Loading screen while we check cloud memory
  if (screen === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: "monospace" }}>
        <div style={{ color: C.textMuted, fontSize: "13px" }}>loading sage...</div>
      </div>
    );
  }

  if (screen === "onboarding") return <Onboarding onComplete={handleOnboarding} />;

  const name = memory?.profile?.name || "there";

  return (
    <div style={{ minHeight: "100vh", background: C.bg,
      display: "flex", flexDirection: "column",
      fontFamily: "Georgia, serif",
      backgroundImage: "radial-gradient(ellipse at 0% 0%, rgba(225,29,72,0.07) 0%, transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(147,51,234,0.07) 0%, transparent 50%)"
    }}>
      <style>{`
        @keyframes pulse{0%,100%{transform:scale(.7);opacity:.4}50%{transform:scale(1);opacity:1}}
        @keyframes slideIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
        *{scrollbar-width:thin;scrollbar-color:rgba(225,29,72,0.15) transparent}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(225,29,72,0.15);border-radius:3px}
      `}</style>

      {toasts.map((a, i) => (
        <AchievementToast key={`${a.id}-${i}`} achievement={a}
          onDismiss={() => setToasts(p => p.filter((_, j) => j !== i))} />
      ))}

      {pendingReward && <RewardModal reward={pendingReward} onClose={() => setPendingReward(null)} />}

      {/* Header */}
      <div style={{ background: "rgba(10,0,8,0.92)", borderBottom: "1px solid rgba(225,29,72,0.12)",
        padding: "12px 20px", display: "flex", alignItems: "center", gap: "12px",
        position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(14px)" }}>
        <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: C.gradMain,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "17px", boxShadow: "0 2px 16px rgba(225,29,72,0.45)", flexShrink: 0 }}>✦</div>
        <div>
          <div style={{ color: C.textPrimary, fontWeight: "700", fontSize: "17px",
            fontFamily: "monospace", letterSpacing: "0.06em" }}>SAGE</div>
          <div style={{ color: C.textMuted, fontSize: "11px", fontFamily: "monospace" }}>
            hey {name} 👋
          </div>
        </div>
        <div style={{ marginLeft: "12px", color: C.textSec, fontSize: "13px",
          fontFamily: "Georgia, serif", fontStyle: "italic",
          display: "none", ...(window.innerWidth > 500 ? { display: "block" } : {}) }}>
          knows everything. charges nothing. dad jokes included.
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
          {loading && activeAgent && <AgentBadge agent={activeAgent} />}
          {!loading && <span style={{ color: "#4ade80", fontSize: "11px", fontFamily: "monospace" }}>● ready</span>}
          <button onClick={reset} style={{ background: "none", border: `1px solid ${C.border}`,
            borderRadius: "7px", padding: "3px 10px", color: C.textMuted, fontSize: "11px",
            cursor: "pointer", fontFamily: "monospace" }}>↺ reset</button>
        </div>
      </div>

      {memory && <StatsBar memory={memory} />}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 18px",
        maxWidth: "800px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0,
              background: C.gradMain, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>✦</div>
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`,
              borderRadius: "18px 18px 18px 4px", padding: "12px 16px",
              display: "flex", gap: "5px", alignItems: "center" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", background: C.pink,
                  animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i*0.22}s` }} />
              ))}
              <span style={{ color: C.textMuted, fontSize: "12px", marginLeft: "8px", fontFamily: "monospace" }}>
                {{ research: "researching...", emotional: "here with you...", planner: "planning...", casual: "thinking..." }[activeAgent] || "thinking..."}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: C.redSoft, border: "1px solid rgba(225,29,72,0.3)",
            borderRadius: "10px", padding: "11px 15px", color: "#fca5a5",
            fontSize: "14px", marginBottom: "14px" }}>⚠️ {error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ borderTop: "1px solid rgba(225,29,72,0.1)", background: "rgba(10,0,8,0.8)",
        backdropFilter: "blur(12px)", padding: "14px 18px 18px", position: "sticky", bottom: 0 }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          {files.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "9px" }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px",
                  background: C.pinkSoft, border: `1px solid ${C.borderWarm}`,
                  borderRadius: "20px", padding: "3px 9px", fontSize: "12px", color: C.pinkLight,
                  fontFamily: "monospace" }}>
                  <span>{f.type.startsWith("image/") ? "🖼️" : "📄"}</span>
                  <span style={{ maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                  <button onClick={() => setFiles(p => p.filter((_,j) => j !== i))} style={{
                    background: "none", border: "none", cursor: "pointer", color: C.pinkLight, fontSize: "13px", padding: 0 }}>×</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: "9px", alignItems: "flex-end",
            background: C.bgInput, border: "1px solid rgba(225,29,72,0.15)",
            borderRadius: "16px", padding: "10px 12px" }}>
            <button onClick={() => fileRef.current?.click()} style={{ background: "none", border: "none",
              cursor: "pointer", color: C.textMuted, fontSize: "19px", padding: "2px 3px",
              flexShrink: 0, lineHeight: 1, transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = C.pinkLight}
              onMouseLeave={e => e.target.style.color = C.textMuted}>📎</button>
            <input ref={fileRef} type="file" multiple
              accept="image/*,application/pdf,.txt,.doc,.docx" style={{ display: "none" }}
              onChange={e => { setFiles(p => [...p, ...Array.from(e.target.files||[])]); e.target.value=""; }} />
            <textarea ref={textareaRef} value={input}
              onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={`Ask Sage anything, ${name}... attach homework, photos, or PDFs 📚`}
              rows={1} style={{ flex: 1, background: "none", border: "none", outline: "none",
                color: C.textPrimary, fontSize: "16px", lineHeight: "1.6",
                resize: "none", fontFamily: "Georgia, serif", fontStyle: "italic", overflowY: "hidden" }} />
            <button onClick={handleSend}
              disabled={loading || (!input.trim() && files.length === 0)} style={{
                background: (!loading && (input.trim() || files.length > 0)) ? C.gradMain : "rgba(255,255,255,0.05)",
                border: "none", borderRadius: "10px", width: "38px", height: "38px",
                cursor: loading ? "wait" : "pointer", color: "white", fontSize: "16px",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                transition: "all 0.2s",
                boxShadow: (!loading && (input.trim() || files.length > 0)) ? "0 2px 12px rgba(225,29,72,0.4)" : "none"
              }}>↑</button>
          </div>
          <p style={{ color: C.textMuted, fontSize: "11px", textAlign: "center", marginTop: "7px",
            fontFamily: "monospace" }}>
            attach homework photos, pdfs, worksheets · shift+enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
