import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════
//  SAGE v3 — Personalized Multi-Agent Tutor
//  Features: Scaffolded answers · YouTube resources · Hobby integration
//            Achievements/rewards · Expanded onboarding · Richer memory
// ═══════════════════════════════════════════════════════════════════

// ─── Memory ─────────────────────────────────────────────────────────
const MEMORY_KEY = "sage_v3_memory";

function loadMemory() {
  try { const r = localStorage.getItem(MEMORY_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function saveMemory(m) {
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(m)); } catch {}
}
function initMemory(profile) {
  return {
    profile,
    sessionCount: 0,
    subjects: {},
    recentTopics: [],
    achievements: [],          // earned badge ids
    studyPoints: 0,            // points toward pattern rewards
    personalNotes: [],
    stuckCount: {},            // track per-topic struggle
    createdAt: Date.now(),
  };
}

// ─── Achievements / Rewards ──────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: "first_session",   label: "First Step 🌱",       desc: "Started your first session with Sage",         points: 10  },
  { id: "math_session",    label: "Number Cruncher 🔢",   desc: "Completed a math tutoring session",            points: 15  },
  { id: "essay_session",   label: "Wordsmith ✍️",         desc: "Worked through a writing assignment",          points: 15  },
  { id: "research_done",   label: "Deep Diver 🔬",        desc: "Used the research agent for a big assignment", points: 20  },
  { id: "three_sessions",  label: "On a Roll 🔥",         desc: "Completed 3 total sessions",                   points: 25  },
  { id: "ten_sessions",    label: "Dedicated 💪",         desc: "10 sessions completed — seriously impressive", points: 50  },
  { id: "planner_used",    label: "Got Organized 📅",     desc: "Used the planner to sort out your workload",   points: 15  },
  { id: "crochet_unlock",  label: "🧶 Pattern Unlocked!", desc: "Earned a crochet pattern reward!",             points: 0, isReward: true, threshold: 75 },
];

const CROCHET_PATTERNS = [
  { name: "Beginner Granny Square",   url: "https://www.ravelry.com/patterns/search#craft=crochet&difficulty=1&sort=best&view=store",  desc: "Classic and satisfying" },
  { name: "Simple Amigurumi Animal",  url: "https://www.ravelry.com/patterns/search#craft=crochet&difficulty=2&sort=best",             desc: "Cute and surprisingly quick" },
  { name: "Cozy Slouchy Beanie",      url: "https://www.ravelry.com/patterns/search#craft=crochet&pc=hat&difficulty=2",                desc: "Wearable and fun to customize" },
  { name: "Chunky Blanket Square",    url: "https://www.ravelry.com/patterns/search#craft=crochet&pc=afghans&difficulty=1",            desc: "Great for Netflix nights" },
  { name: "Market Bag / Tote",        url: "https://www.ravelry.com/patterns/search#craft=crochet&pc=bag&difficulty=2",                desc: "Actually useful and stylish" },
];

// YouTube resource channels by subject
const YOUTUBE_RESOURCES = {
  math:    ["3Blue1Brown (visual math magic)", "Professor Leonard (full algebra lectures)", "Khan Academy Math", "The Organic Chemistry Tutor"],
  science: ["CrashCourse Biology", "Kurzgesagt (concepts with stunning visuals)", "Khan Academy Science", "Amoeba Sisters (biology)"],
  history: ["CrashCourse World History", "CrashCourse US History", "Overly Sarcastic Productions", "Khan Academy History"],
  english: ["CrashCourse Literature", "TED-Ed (short powerful essays)", "Ellen Brock (writing craft)", "Sheridan Voigt (essay structure)"],
  general: ["CrashCourse (any subject)", "Khan Academy", "TED-Ed", "Vsauce (curiosity-driven learning)"],
};

// ─── File helpers ────────────────────────────────────────────────────
const fileToBase64 = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result.split(",")[1]);
  r.onerror = rej;
  r.readAsDataURL(file);
});

// ─── Onboarding steps ────────────────────────────────────────────────
const ONBOARDING = [
  { id: "name",          type: "text",   placeholder: "Your name or nickname...",
    question: () => "Hey! Before we dive in, I want to actually get to know you. What's your name? (Nickname totally fine 😊)" },

  { id: "grade_feel",    type: "choice",
    question: (a) => `Nice to meet you, ${a.name}! Okay, real talk — how are you feeling about school right now?`,
    options: [
      { value: "overwhelmed", label: "😵 Pretty overwhelmed honestly" },
      { value: "behind",      label: "📉 Behind and stressed about catching up" },
      { value: "okay",        label: "🤷 Okay I guess, could be better" },
      { value: "ready",       label: "💪 Ready to actually get stuff done" },
    ]},

  { id: "fav_subject",   type: "choice",
    question: () => "Every student has at least one subject that's secretly kind of interesting. Which is yours?",
    options: [
      { value: "math",      label: "🔢 Math — numbers actually make sense to me" },
      { value: "english",   label: "📖 English / Writing" },
      { value: "science",   label: "🔬 Science" },
      { value: "history",   label: "📜 History" },
      { value: "art_music", label: "🎨 Art or Music" },
      { value: "none",      label: "😅 Honestly none of them right now" },
    ]},

  { id: "hard_subject",  type: "choice",
    question: () => "And the one that makes you want to just close the laptop?",
    options: [
      { value: "math",    label: "🔢 Math — it's just not clicking" },
      { value: "english", label: "📖 English / Essays are painful" },
      { value: "science", label: "🔬 Science" },
      { value: "history", label: "📜 History — way too much memorizing" },
      { value: "all",     label: "😭 All of them honestly" },
    ]},

  { id: "learning_style", type: "choice",
    question: () => "When you're learning something new, what actually works for you?",
    options: [
      { value: "examples",    label: "💡 Show me an example first, then explain" },
      { value: "stepbystep",  label: "📋 Walk me through it one step at a time" },
      { value: "explain_why", label: "🤔 Tell me WHY it works before the HOW" },
      { value: "just_try",    label: "🚀 Let me try it, help when I get stuck" },
    ]},

  { id: "hobbies",        type: "choice",
    question: () => "What do you actually enjoy doing when school isn't happening?",
    options: [
      { value: "crochet_art",  label: "🧶 Crafts — crocheting, drawing, making things" },
      { value: "music_dance",  label: "🎵 Music / Dance / Performance" },
      { value: "outdoors",     label: "🌿 Being outside — nature, animals, sports" },
      { value: "gaming_tech",  label: "🎮 Gaming / Tech / Videos" },
      { value: "reading_write",label: "📚 Reading, writing stories, creative stuff" },
    ]},

  { id: "crochet_level",  type: "choice",
    question: () => "You mentioned crafts — crocheting especially. How long have you been doing it?",
    options: [
      { value: "beginner",     label: "🌱 I'm still learning the basics" },
      { value: "intermediate", label: "🧶 I can follow most patterns" },
      { value: "advanced",     label: "⭐ I can do complex patterns, I love it" },
      { value: "not_really",   label: "😅 Not really my thing actually" },
    ]},

  { id: "one_thing",      type: "text",   skippable: true,
    placeholder: "Whatever you want me to know... or just skip ❤️",
    question: () => "Last one, I promise. Is there anything you wish people just understood about you? (Optional — totally your call)" },
];

// ─── Agent Prompts ───────────────────────────────────────────────────

function buildOrchestratorPrompt(memory) {
  const p = memory?.profile || {};
  return `You are the invisible ORCHESTRATOR for Sage, a tutor AI built for ${p.name || "a student"}, a 10th grader at Cane Bay High School, South Carolina.

STUDENT SNAPSHOT:
- Name: ${p.name || "?"}, School feel: ${p.grade_feel || "?"}, Fav subject: ${p.fav_subject || "?"}, Hard subject: ${p.hard_subject || "?"}
- Learning style: ${p.learning_style || "?"}, Hobbies: ${p.hobbies || "?"}, Crochet level: ${p.crochet_level || "?"}
- Sessions completed: ${memory?.sessionCount || 0}, Study points: ${memory?.studyPoints || 0}

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
- "casual" → chatting, not homework, personal talk, crocheting, life stuff
- needs_humor: true ~30% of tutor/planner, higher if she seems stressed (humor defuses), never for emotional
- suggest_video: true when a visual explanation would significantly help (geometry, biology, history events, math concepts)
- hobby_bridge: true when there's a natural way to connect this topic to crocheting or her interests`;
}

function buildTutorPrompt(memory, subject, needsHumor, contextNote, suggestVideo, hobbyBridge) {
  const p = memory?.profile || {};
  const name = p.name || "there";
  const style = p.learning_style || "stepbystep";
  const crochetLevel = p.crochet_level;
  const channels = (YOUTUBE_RESOURCES[subject] || YOUTUBE_RESOURCES.general).join(", ");

  const styleGuide = {
    examples:    "Lead with a concrete worked example BEFORE the rule. Show first, explain second.",
    stepbystep:  "Break everything into clearly numbered steps. Never skip one — even obvious steps.",
    explain_why: "Start with WHY this concept exists and why it matters. Then show HOW to apply it.",
    just_try:    "Give a minimal hint. Ask what she thinks the next step is. Let her drive — help when stuck.",
  }[style] || "Be clear, patient, and check in frequently.";

  // The escalation ladder — this is the key behavioral change from v2
  const scaffoldingRules = `
ANSWER SCAFFOLDING — GRADUATED SUPPORT:
Never leave her stuck for more than 2 exchanges. Escalate through these levels naturally:
  Level 1 (first response): Give a hint or guiding question. Nudge her toward the answer.
  Level 2 (if still stuck): Provide a worked example of a SIMILAR problem, then ask her to apply it.
  Level 3 (if still stuck): Show the full solution clearly, step by step. Then explain WHY each step works.
  Level 4 (after any answer): Always ask a quick follow-up like "Does that make sense? Want to try a similar one?"

If the topic is clearly too broad or complex to solve by guiding alone — just be honest: "This one's a lot to unpack. Let me just show you how it works and then we'll practice together." Then give the full explanation. Student time and confidence matter more than perfect Socratic technique.`;

  const humorGuide = needsHumor ? `
DAD HUMOR IS ON 🎉 — ONE joke per response, woven in naturally. Make it:
- A groan-worthy pun related to the subject ("Why did the math book look so sad? Too many problems.")
- Self-aware ("That pun was terrible. Almost as bad as this quadratic equation. Let's tackle both.")
- Quick and never repeated. One and done.` : "";

  const hobbyGuide = hobbyBridge && crochetLevel && crochetLevel !== "not_really" ? `
HOBBY BRIDGE — CROCHETING CONNECTION:
${name} crochets (level: ${crochetLevel}). Find a natural analogy to her craft:
- Math patterns ↔ stitch counts and repeat sequences
- Fractions/ratios ↔ yarn weight and needle sizing
- Geometry ↔ shaping, increases, decreases in pattern work
- Reading comprehension ↔ following a complex crochet pattern
- Biology cell structure ↔ the interlocking loops of a stitch
Use the analogy once, briefly, to make the concept click. Don't force it.` : "";

  const videoGuide = suggestVideo ? `
VIDEO SUGGESTION — at the end of your response, add a line like:
"🎥 This might click better visually — try searching YouTube for: [specific search phrase]
Good channels for this: ${channels}"
Keep it brief. One suggestion max.` : "";

  return `You are Sage, a warm, brilliant tutor for ${name} — 10th grade, Cane Bay High School, SC.
She's been through a lot and is working hard to catch up. Your job is to guide, support, and believe in her.

CONTEXT: ${contextNote || "Regular tutoring session."}
TEACHING STYLE FOR ${name.toUpperCase()}: ${styleGuide}
${scaffoldingRules}
${humorGuide}
${hobbyGuide}
${videoGuide}

ALWAYS:
- Acknowledge frustration with ONE sentence before continuing ("This one trips a lot of people up — let's slow down.")
- Celebrate when she gets something, even small wins
- Check for understanding before moving on
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
5. Suggest structure: how to organize her response, what each section should do
6. At the end, always suggest 2 YouTube searches that would help her understand the topic visually

Help her think, not just collect. Ask "what angle interests you most about this?" before diving in.`;
}

function buildEmotionalPrompt(memory) {
  const p = memory?.profile || {};
  const name = p.name || "she";
  return `You are Sage's EMOTIONAL SUPPORT mode for ${name}.

${name} is 16. She lost her mother in early 2025. Her family moved many times. She is in weekly counseling, which is great. She is trying.

When she's overwhelmed, sad, or brings up something hard:
1. Acknowledge first. Don't rush to fix. "That sounds really heavy" is sometimes the whole response needed.
2. Be real. Not therapy-speak. Like a caring older sister or mentor.
3. If she mentions her mom, pause there. Honor it. Don't rush past.
4. Find ONE small, manageable next step — not a list, not a lecture. One thing.
5. Remind her gently that falling behind ≠ being behind in terms of her worth or her future.
6. If things sound serious, gently encourage her to talk to her counselor or a trusted adult.
7. End by asking: "What would feel most helpful right now?"

You are not her therapist. You are someone genuinely in her corner.`;
}

function buildPlannerPrompt(memory) {
  const p = memory?.profile || {};
  return `You are Sage's PLANNER mode for ${p.name || "a student"} who needs help organizing her work.

She tends to get overwhelmed seeing the full pile. Your approach:
1. Have her list everything that's due — get it all out
2. Sort it: due date → grade impact → difficulty
3. Help her identify the ONE thing to start with (not the biggest, the most strategic)
4. Estimate time for each item honestly
5. Build a "today" list of 2-3 max — nothing more
6. Acknowledge that making a plan when you're overwhelmed is genuinely hard and she did it

Keep the tone calm, organized, quietly encouraging. One light dad joke is fine if the moment calls for it.`;
}

function buildCasualPrompt(memory) {
  const p = memory?.profile || {};
  const name = p.name || "there";
  const crochet = p.crochet_level && p.crochet_level !== "not_really";
  return `You are Sage in CASUAL / COMPANION mode with ${name}.

She's not doing homework right now — she's just talking. Be real, warm, interested.

${crochet ? `She crochets and loves it. If she brings it up, engage genuinely:
- Ask about what she's making, what patterns she likes
- You can suggest pattern ideas based on her skill level (${p.crochet_level})
- Recommend checking Ravelry.com for patterns — it's free and has thousands
- Celebrate whatever she's working on` : ""}

Other conversation topics are totally fine — life, music, things she's thinking about, questions about the world.
If she mentions a boy she likes, be warm and appropriately delighted (and maybe gently remind her that confidence is very attractive 😄).

You can be funny, curious, opinionated (gently). You're a friend who also happens to know everything.
If she naturally transitions back to homework, follow her lead.`;
}

// ─── API helper ──────────────────────────────────────────────────────
async function callClaude(system, messages, max = 1300) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: max,
      system,
      messages,
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || `API error ${res.status}`);
  }
  const d = await res.json();
  return d.content?.find(b => b.type === "text")?.text || "";
}

// ─── Achievement helpers ─────────────────────────────────────────────
function checkAchievements(memory, trigger) {
  const earned = memory.achievements || [];
  const newOnes = [];
  let points = memory.studyPoints || 0;

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

  // Crochet pattern reward threshold
  const rewardAch = ACHIEVEMENTS.find(x => x.id === "crochet_unlock");
  if (rewardAch && points >= rewardAch.threshold && !earned.includes("crochet_unlock")) {
    newOnes.push(rewardAch); earned.push("crochet_unlock");
  }

  return { newAchievements: newOnes, updatedEarned: earned, updatedPoints: points };
}

// ─── Sub-components ───────────────────────────────────────────────────

const AGENT_BADGES = {
  tutor:     { label: "Tutor",        color: "#f59e4a", icon: "📚" },
  research:  { label: "Research",     color: "#60a5fa", icon: "🔬" },
  emotional: { label: "Here for you", color: "#c084fc", icon: "💙" },
  planner:   { label: "Planner",      color: "#34d399", icon: "📅" },
  casual:    { label: "Just chatting",color: "#fb7185", icon: "✨" },
};

function AgentBadge({ agent }) {
  const b = AGENT_BADGES[agent] || AGENT_BADGES.tutor;
  return (
    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px",
      background: `${b.color}22`, border: `1px solid ${b.color}44`, color: b.color,
      fontFamily: "monospace", letterSpacing: "0.05em" }}>
      {b.icon} {b.label}
    </span>
  );
}

function AchievementToast({ achievement, onDismiss }) {
  useEffect(() => { const t = setTimeout(onDismiss, 5000); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: "fixed", bottom: "90px", right: "20px", zIndex: 100,
      background: achievement.isReward
        ? "linear-gradient(135deg, #7c3aed, #db2777)"
        : "linear-gradient(135deg, #f59e4a, #e8556a)",
      borderRadius: "14px", padding: "14px 18px", maxWidth: "280px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)", animation: "slideIn 0.4s ease",
      cursor: "pointer"
    }} onClick={onDismiss}>
      <div style={{ fontSize: "22px", marginBottom: "4px" }}>
        {achievement.isReward ? "🧶" : "🏆"}
      </div>
      <div style={{ color: "white", fontWeight: "700", fontSize: "14px", marginBottom: "2px" }}>
        {achievement.label}
      </div>
      <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "12px", lineHeight: "1.4" }}>
        {achievement.desc}
      </div>
    </div>
  );
}

function StatsBar({ memory }) {
  const pts = memory?.studyPoints || 0;
  const rewardThreshold = 75;
  const pct = Math.min((pts / rewardThreshold) * 100, 100);
  const sessions = memory?.sessionCount || 0;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "14px",
      padding: "8px 14px", background: "rgba(255,255,255,0.025)",
      borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "12px"
    }}>
      <span style={{ color: "#5a5048" }}>Sessions: <span style={{ color: "#f59e4a" }}>{sessions}</span></span>
      <span style={{ color: "#5a5048" }}>Points: <span style={{ color: "#f59e4a" }}>{pts}</span></span>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "#5a5048", whiteSpace: "nowrap" }}>🧶 Pattern reward:</span>
        <div style={{ flex: 1, height: "5px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`,
            background: "linear-gradient(90deg, #7c3aed, #db2777)", borderRadius: "3px",
            transition: "width 0.6s ease" }} />
        </div>
        <span style={{ color: pct >= 100 ? "#db2777" : "#5a5048", whiteSpace: "nowrap" }}>
          {pct >= 100 ? "🎉 Unlocked!" : `${pts}/${rewardThreshold}`}
        </span>
      </div>
    </div>
  );
}

function PatternRewardModal({ onClose }) {
  const pattern = CROCHET_PATTERNS[Math.floor(Math.random() * CROCHET_PATTERNS.length)];
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
    }}>
      <div style={{
        background: "linear-gradient(135deg, #1a0a2e, #2d0a1e)",
        border: "1px solid rgba(219,39,119,0.4)", borderRadius: "20px",
        padding: "40px 36px", maxWidth: "420px", width: "100%", textAlign: "center",
        boxShadow: "0 20px 60px rgba(219,39,119,0.3)"
      }}>
        <div style={{ fontSize: "52px", marginBottom: "16px" }}>🧶</div>
        <h2 style={{ color: "#fde9c8", fontSize: "22px", fontWeight: "normal", marginBottom: "8px" }}>
          You Earned a Pattern!
        </h2>
        <p style={{ color: "#9a7aa0", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
          Your study points unlocked a crochet pattern reward. You did the work — here's something fun.
        </p>
        <div style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "12px", padding: "16px", marginBottom: "24px"
        }}>
          <div style={{ color: "#fde9c8", fontWeight: "600", fontSize: "16px", marginBottom: "4px" }}>
            {pattern.name}
          </div>
          <div style={{ color: "#7a6070", fontSize: "13px", marginBottom: "12px" }}>{pattern.desc}</div>
          <a href={pattern.url} target="_blank" rel="noopener noreferrer" style={{
            display: "inline-block", background: "linear-gradient(135deg, #7c3aed, #db2777)",
            color: "white", borderRadius: "8px", padding: "8px 20px", fontSize: "13px",
            textDecoration: "none", fontWeight: "600"
          }}>Browse Patterns →</a>
        </div>
        <button onClick={onClose} style={{
          background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
          padding: "8px 20px", color: "#5a5048", cursor: "pointer", fontSize: "13px", fontFamily: "inherit"
        }}>Keep studying</button>
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "20px", gap: "10px", alignItems: "flex-end" }}>
      {!isUser && (
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #f59e4a, #e8556a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "17px", boxShadow: "0 2px 10px rgba(245,158,74,0.4)" }}>✦</div>
      )}
      <div style={{ maxWidth: "74%", display: "flex", flexDirection: "column", gap: "6px" }}>
        {!isUser && msg.agent && <div><AgentBadge agent={msg.agent} /></div>}
        {msg.images?.map((src, i) => (
          <img key={i} src={src} alt="" style={{ maxWidth: "220px", borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.1)" }} />
        ))}
        {msg.fileNames?.map((name, i) => (
          <span key={i} style={{ background: "rgba(251,191,105,0.1)", border: "1px solid rgba(251,191,105,0.25)",
            borderRadius: "8px", padding: "3px 10px", fontSize: "12px", color: "#fbbf69" }}>📄 {name}</span>
        ))}
        {msg.text && (
          <div style={{
            background: isUser ? "rgba(245,158,74,0.1)" : "rgba(255,255,255,0.05)",
            border: isUser ? "1px solid rgba(245,158,74,0.28)" : "1px solid rgba(255,255,255,0.07)",
            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            padding: "13px 17px", color: isUser ? "#fde9c8" : "#e8e0d8",
            fontSize: "15px", lineHeight: "1.72", whiteSpace: "pre-wrap", wordBreak: "break-word"
          }}>{msg.text}</div>
        )}
      </div>
      {isUser && (
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #7c6aff, #c45bdb)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "15px", boxShadow: "0 2px 10px rgba(124,106,255,0.4)" }}>✿</div>
      )}
    </div>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [textInput, setTextInput] = useState("");
  const [fading, setFading] = useState(false);

  const cur = ONBOARDING[step];
  const q = cur.question(answers);

  // Skip the crochet_level question if hobbies isn't crochet-related
  useEffect(() => {
    if (cur.id === "crochet_level" && answers.hobbies !== "crochet_art") {
      setAnswers(a => ({ ...a, crochet_level: "not_really" }));
      advance("not_really", true);
    }
  }, [step]);

  function advance(value, skipAnim = false) {
    const na = { ...answers, [cur.id]: value };
    setAnswers(na);
    setTextInput("");
    if (skipAnim) { stepForward(na); return; }
    setFading(true);
    setTimeout(() => { setFading(false); stepForward(na); }, 300);
  }

  function stepForward(na) {
    if (step < ONBOARDING.length - 1) setStep(s => s + 1);
    else onComplete(na);
  }

  const pct = (step / ONBOARDING.length) * 100;

  return (
    <div style={{ minHeight: "100vh", background: "#0c0a08",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "'Georgia', serif" }}>
      <div style={{ width: "100%", maxWidth: "520px", marginBottom: "36px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ color: "#5a5048", fontSize: "13px" }}>Getting to know you</span>
          <span style={{ color: "#5a5048", fontSize: "13px" }}>{step + 1} / {ONBOARDING.length}</span>
        </div>
        <div style={{ height: "3px", background: "rgba(255,255,255,0.07)", borderRadius: "2px" }}>
          <div style={{ height: "100%", width: `${pct}%`,
            background: "linear-gradient(90deg, #f59e4a, #e8556a)", borderRadius: "2px",
            transition: "width 0.4s ease" }} />
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: "520px",
        background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px", padding: "38px 34px",
        opacity: fading ? 0 : 1, transform: fading ? "translateY(8px)" : "translateY(0)",
        transition: "opacity 0.28s ease, transform 0.28s ease" }}>
        <div style={{ width: "46px", height: "46px", borderRadius: "50%",
          background: "linear-gradient(135deg, #f59e4a, #e8556a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "20px", marginBottom: "22px", boxShadow: "0 4px 16px rgba(245,158,74,0.28)" }}>✦</div>
        <p style={{ color: "#e8e0d8", fontSize: "18px", lineHeight: "1.65", marginBottom: "26px" }}>{q}</p>

        {cur.type === "choice" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            {cur.options.map(o => (
              <button key={o.value} onClick={() => advance(o.value)} style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "11px", padding: "12px 16px", color: "#e8e0d8",
                fontSize: "14px", cursor: "pointer", textAlign: "left",
                transition: "all 0.15s ease", fontFamily: "inherit" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,158,74,0.1)"; e.currentTarget.style.borderColor = "rgba(245,158,74,0.35)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; }}
              >{o.label}</button>
            ))}
          </div>
        )}

        {cur.type === "text" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            <input autoFocus type="text" value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && textInput.trim() && advance(textInput.trim())}
              placeholder={cur.placeholder} style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "11px", padding: "12px 14px", color: "#fde9c8",
                fontSize: "15px", outline: "none", fontFamily: "inherit",
                width: "100%", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: "9px" }}>
              <button onClick={() => textInput.trim() && advance(textInput.trim())} style={{
                flex: 1, background: "linear-gradient(135deg, #f59e4a, #e8556a)",
                border: "none", borderRadius: "10px", padding: "11px",
                color: "white", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>
                Continue →
              </button>
              {cur.skippable && (
                <button onClick={() => advance("[skipped]")} style={{
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "10px", padding: "11px 14px",
                  color: "#5a5048", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>
                  Skip
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Setup ────────────────────────────────────────────────────────────
function Setup({ onConfirm }) {
  const [key, setKey] = useState("");
  return (
    <div style={{ minHeight: "100vh", background: "#0c0a08",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "'Georgia', serif" }}>
      <div style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px", padding: "46px 38px", maxWidth: "420px", width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "54px", marginBottom: "14px" }}>✦</div>
        <h1 style={{ color: "#fde9c8", fontSize: "30px", fontWeight: "normal", letterSpacing: "0.02em", marginBottom: "10px" }}>Sage</h1>
        <p style={{ color: "#7a6e64", fontSize: "15px", lineHeight: "1.65", marginBottom: "34px" }}>
          Your personal tutor. Patient, warm, and occasionally a little corny.
        </p>
        <p style={{ color: "#4a433c", fontSize: "13px", marginBottom: "10px" }}>Anthropic API key</p>
        <input type="password" value={key} onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === "Enter" && key.trim() && onConfirm(key.trim())}
          placeholder="sk-ant-..." style={{
            width: "100%", boxSizing: "border-box",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.11)",
            borderRadius: "10px", padding: "12px 15px", color: "#fde9c8",
            fontSize: "14px", outline: "none", marginBottom: "12px", fontFamily: "monospace" }} />
        <button onClick={() => key.trim() && onConfirm(key.trim())} style={{
          width: "100%", background: "linear-gradient(135deg, #f59e4a, #e8556a)",
          border: "none", borderRadius: "10px", padding: "13px",
          color: "white", fontSize: "15px", fontWeight: "600", cursor: "pointer",
          letterSpacing: "0.03em", fontFamily: "inherit" }}>Open Sage →</button>
        <p style={{ color: "#2e2720", fontSize: "12px", marginTop: "18px", lineHeight: "1.5" }}>
          Key is stored only in your browser session. Get one at console.anthropic.com
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function SageV3() {
  const [apiKey, setApiKey]           = useState("");
 const [screen, setScreen] = useState("onboarding");
  const [memory, setMemory]           = useState(null);
  const [messages, setMessages]       = useState([]);
  const [apiHistory, setApiHistory]   = useState([]);
  const [input, setInput]             = useState("");
  const [files, setFiles]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [error, setError]             = useState("");
  const [toasts, setToasts]           = useState([]);   // achievement toasts
  const [showReward, setShowReward]   = useState(false);

  const bottomRef  = useRef(null);
  const fileRef    = useRef(null);
  const textareaRef = useRef(null);

  // Restore session
  uuseEffect(() => {
  const mem = loadMemory();
  if (mem) { setMemory(mem); setScreen("chat"); }
  else setScreen("onboarding");
}, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  // Initial greeting once in chat
  useEffect(() => {
    if (screen !== "chat" || messages.length > 0 || !memory) return;
    doGreeting(memory);
  }, [screen, memory]);

  async function doGreeting(mem) {
    const p = mem.profile;
    const isReturn = mem.sessionCount > 1;
    const prompt = isReturn
      ? `You are Sage. ${p.name} is back for session ${mem.sessionCount}. Write a brief (2-3 sentence) warm welcome-back. Reference something specific from her profile (she likes ${p.fav_subject}, struggles with ${p.hard_subject}, hobbies: ${p.hobbies}). End by asking what she's working on today. Include one quick pun or dad joke.`
      : `You are Sage. ${p.name || "A student"} just set up their profile. Write a warm, personal first greeting (3-4 sentences). Reference: she feels "${p.grade_feel}" about school, likes ${p.fav_subject}, finds ${p.hard_subject} hard, learns best by ${p.learning_style}, hobbies: ${p.hobbies}. Reassure her she's in the right place, no judgment. End by asking what to tackle first. One quick dad joke or pun.`;
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

  function handleSetup(key) {
    sessionStorage.setItem("sage_key", key);
    setApiKey(key);
    const mem = loadMemory();
    if (mem) { setMemory(mem); setScreen("chat"); }
    else setScreen("onboarding");
  }

  function handleOnboarding(profile) {
    const mem = initMemory(profile);
    mem.sessionCount = 1;
    saveMemory(mem);
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
      // ── Orchestrator ──────────────────────────────────────────────
      const routeRaw = await callClaude(
        buildOrchestratorPrompt(memory),
        [{ role: "user", content: [{ type: "text", text: userText || "[files attached]" }] }],
        250
      );
      let route = { agent: "tutor", subject: "general", needs_humor: false, suggest_video: false, hobby_bridge: false, context_note: "" };
      try { const m = routeRaw.match(/\{[\s\S]*\}/); if (m) route = { ...route, ...JSON.parse(m[0]) }; } catch {}

      setActiveAgent(route.agent);

      // ── Specialized agent ──────────────────────────────────────────
      let sys;
      if (route.agent === "research")  sys = buildResearchPrompt(memory);
      else if (route.agent === "emotional") sys = buildEmotionalPrompt(memory);
      else if (route.agent === "planner")   sys = buildPlannerPrompt(memory);
      else if (route.agent === "casual")    sys = buildCasualPrompt(memory);
      else sys = buildTutorPrompt(memory, route.subject, route.needs_humor, route.context_note, route.suggest_video, route.hobby_bridge);

      const newHist = [...apiHistory, { role: "user", content: contentBlocks }];
      const reply = await callClaude(sys, newHist, 1400);

      const asstMsg = { role: "assistant", content: [{ type: "text", text: reply }] };
      setApiHistory([...newHist, asstMsg]);
      setMessages(prev => [...prev, { role: "assistant", text: reply, agent: route.agent }]);

      // ── Update memory + achievements ──────────────────────────────
      const updMem = { ...memory };
      updMem.sessionCount = (updMem.sessionCount || 0) + 1;
      if (route.subject && route.subject !== "general") {
        updMem.subjects[route.subject] = updMem.subjects[route.subject] || { sessions: 0 };
        updMem.subjects[route.subject].sessions += 1;
        updMem.recentTopics = [route.subject, ...((updMem.recentTopics || []).filter(t => t !== route.subject))].slice(0, 8);
      }

      const { newAchievements, updatedEarned, updatedPoints } = checkAchievements(updMem, route.agent === "research" ? "research" : route.subject);
      updMem.achievements = updatedEarned;
      updMem.studyPoints = updatedPoints;
      saveMemory(updMem);
      setMemory(updMem);

      if (newAchievements.length > 0) {
        setToasts(prev => [...prev, ...newAchievements]);
        if (newAchievements.some(a => a.isReward)) setShowReward(true);
      }

    } catch(e) { setError(e.message || "Something went wrong."); }
    finally { setLoading(false); setActiveAgent(null); }
  }

  function handleKeyDown(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }

  function reset() {
    if (!confirm("Reset Sage completely? This clears all memory and achievements.")) return;
    localStorage.removeItem(MEMORY_KEY);
    sessionStorage.removeItem("sage_key");
    setMemory(null); setMessages([]); setApiHistory([]);
    setScreen("setup"); setApiKey("");
  }

  // ── Screen router ─────────────────────────────────────────────────
  if (screen === "setup")      return <Setup onConfirm={handleSetup} />;
  if (screen === "onboarding") return <Onboarding onComplete={handleOnboarding} />;

  const name = memory?.profile?.name || "there";

  return (
    <div style={{ minHeight: "100vh", background: "#0c0a08",
      display: "flex", flexDirection: "column", fontFamily: "'Georgia', 'Times New Roman', serif" }}>

      {/* Achievement toasts */}
      {toasts.map((a, i) => (
        <AchievementToast key={`${a.id}-${i}`} achievement={a}
          onDismiss={() => setToasts(p => p.filter((_, j) => j !== i))} />
      ))}

      {/* Crochet pattern reward modal */}
      {showReward && <PatternRewardModal onClose={() => setShowReward(false)} />}

      {/* Header */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "12px 20px", display: "flex", alignItems: "center", gap: "12px",
        position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%",
          background: "linear-gradient(135deg, #f59e4a, #e8556a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "17px", boxShadow: "0 2px 12px rgba(245,158,74,0.35)", flexShrink: 0 }}>✦</div>
        <div>
          <div style={{ color: "#fde9c8", fontWeight: "600", fontSize: "15px", letterSpacing: "0.03em" }}>Sage</div>
          <div style={{ color: "#4a433c", fontSize: "12px" }}>Hey {name} 👋</div>
        </div>
        {memory?.recentTopics?.slice(0, 3).map(t => (
          <span key={t} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            color: "#5a5048", display: "none", "@media(min-width:500px)": { display: "inline" } }}>{t}</span>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
          {loading && activeAgent && <AgentBadge agent={activeAgent} />}
          {!loading && <span style={{ color: "#4ade80", fontSize: "12px" }}>● Ready</span>}
          <button onClick={reset} style={{ background: "none", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "7px", padding: "3px 9px", color: "#3a332e", fontSize: "11px",
            cursor: "pointer", fontFamily: "inherit" }}>↺</button>
        </div>
      </div>

      {/* Stats bar */}
      {memory && <StatsBar memory={memory} />}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "26px 18px",
        maxWidth: "780px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #f59e4a, #e8556a)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px" }}>✦</div>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "18px 18px 18px 4px", padding: "12px 16px",
              display: "flex", gap: "5px", alignItems: "center" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#f59e4a",
                  animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i*0.2}s` }} />
              ))}
              <span style={{ color: "#4a433c", fontSize: "12px", marginLeft: "6px" }}>
                {{ research: "Researching...", emotional: "Here with you...", planner: "Planning...", casual: "Thinking..." }[activeAgent] || "Thinking..."}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(232,85,106,0.1)", border: "1px solid rgba(232,85,106,0.28)",
            borderRadius: "10px", padding: "11px 15px", color: "#f87a8a", fontSize: "14px", marginBottom: "14px" }}>
            ⚠️ {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)",
        backdropFilter: "blur(10px)", padding: "14px 18px 18px", position: "sticky", bottom: 0 }}>
        <div style={{ maxWidth: "780px", margin: "0 auto" }}>
          {files.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "9px" }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px",
                  background: "rgba(251,191,105,0.1)", border: "1px solid rgba(251,191,105,0.3)",
                  borderRadius: "20px", padding: "3px 9px", fontSize: "12px", color: "#fbbf69" }}>
                  <span>{f.type.startsWith("image/") ? "🖼️" : "📄"}</span>
                  <span style={{ maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                  <button onClick={() => setFiles(p => p.filter((_,j) => j !== i))} style={{
                    background: "none", border: "none", cursor: "pointer", color: "#fbbf69", fontSize: "13px", padding: 0 }}>×</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: "9px", alignItems: "flex-end",
            background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "15px", padding: "9px 11px" }}>
            <button onClick={() => fileRef.current?.click()} style={{ background: "none", border: "none",
              cursor: "pointer", color: "#6a5f56", fontSize: "19px", padding: "2px 3px",
              flexShrink: 0, lineHeight: 1, transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "#fbbf69"}
              onMouseLeave={e => e.target.style.color = "#6a5f56"}>📎</button>
            <input ref={fileRef} type="file" multiple
              accept="image/*,application/pdf,.txt,.doc,.docx" style={{ display: "none" }}
              onChange={e => { setFiles(p => [...p, ...Array.from(e.target.files||[])]); e.target.value=""; }} />
            <textarea ref={textareaRef} value={input}
              onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={`Ask Sage anything, ${name}... attach homework, photos, or PDFs 📚`}
              rows={1} style={{ flex: 1, background: "none", border: "none", outline: "none",
                color: "#e8e0d8", fontSize: "15px", lineHeight: "1.6",
                resize: "none", fontFamily: "inherit", overflowY: "hidden" }} />
            <button onClick={handleSend}
              disabled={loading || (!input.trim() && files.length === 0)} style={{
                background: (!loading && (input.trim() || files.length > 0))
                  ? "linear-gradient(135deg, #f59e4a, #e8556a)"
                  : "rgba(255,255,255,0.06)",
                border: "none", borderRadius: "9px", width: "36px", height: "36px",
                cursor: loading ? "wait" : "pointer", color: "white", fontSize: "16px",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                transition: "all 0.2s" }}>↑</button>
          </div>
          <p style={{ color: "#2e2720", fontSize: "11px", textAlign: "center", marginTop: "7px" }}>
            Attach homework photos, PDFs, worksheets · Shift+Enter for new line
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(.7);opacity:.4} 50%{transform:scale(1);opacity:1} }
        @keyframes slideIn { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        *{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.07) transparent}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:3px}
      `}</style>
    </div>
  );
}
