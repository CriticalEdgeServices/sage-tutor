// ═══════════════════════════════════════════════════════════════════
//  SAGE — Parent Dashboard  (src/ParentDashboard.jsx)
//  Route: /parent  |  PIN protected  |  Read-only view of Asia's progress
//
//  SETUP:
//  1. Change PARENT_PIN below to your own 4-digit PIN
//  2. Add to src/main.jsx — instructions at the bottom of this file
//  3. Create vercel.json in repo root — instructions at the bottom
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

const MEMORY_KEY       = "sage_v4_memory";
const CUSTOM_TIERS_KEY = "sage_parent_custom_tiers";
const PARENT_PIN       = "1234"; // ← CHANGE THIS to your own PIN

// ─── Palette (matches Sage v4) ────────────────────────────────────────
const C = {
  bg:          "#0a0008",
  bgCard:      "rgba(255,255,255,0.03)",
  bgCard2:     "rgba(255,255,255,0.06)",
  border:      "rgba(255,255,255,0.08)",
  borderWarm:  "rgba(220,38,127,0.3)",
  pink:        "#f02d7a",
  pinkLight:   "#ff6eb0",
  pinkSoft:    "rgba(240,45,122,0.12)",
  purple:      "#9333ea",
  purpleLight: "#c084fc",
  purpleSoft:  "rgba(147,51,234,0.12)",
  red:         "#e11d48",
  green:       "#34d399",
  amber:       "#fbbf24",
  textPrimary: "#fde8f0",
  textSec:     "#a0748a",
  textMuted:   "#4a2f3c",
  gradMain:    "linear-gradient(135deg, #e11d48, #9333ea)",
  gradWarm:    "linear-gradient(135deg, #f02d7a, #c084fc)",
};

const REWARD_TIERS = [
  { id: "tier1_crochet",  label: "🧶 Crochet Pattern",   threshold: 50  },
  { id: "tier2_icecream", label: "🍦 Ice Cream Mission",  threshold: 100 },
  { id: "tier3_movie",    label: "🎬 Movie Night",        threshold: 175 },
  { id: "tier4_activity", label: "🌟 Sunday Adventure",   threshold: 300 },
  { id: "tier5_shopping", label: "🛍️ Craft Supply Run",   threshold: 450 },
];

const ACHIEVEMENTS = [
  { id: "first_session",  label: "First Step 🌱",     points: 10, desc: "Started first session" },
  { id: "math_session",   label: "Number Cruncher 🔢", points: 15, desc: "Completed a math session" },
  { id: "essay_session",  label: "Wordsmith ✍️",       points: 15, desc: "Worked on writing" },
  { id: "research_done",  label: "Deep Diver 🔬",      points: 20, desc: "Used the research agent" },
  { id: "three_sessions", label: "On a Roll 🔥",       points: 25, desc: "3 sessions completed" },
  { id: "ten_sessions",   label: "Dedicated 💪",       points: 50, desc: "10 sessions done" },
  { id: "planner_used",   label: "Got Organized 📅",   points: 15, desc: "Used the planner" },
];

const SUBJECT_META = {
  math:    { label: "Math",    icon: "🔢", color: "#60a5fa" },
  english: { label: "English", icon: "📖", color: "#f472b6" },
  science: { label: "Science", icon: "🔬", color: "#34d399" },
  history: { label: "History", icon: "📜", color: "#fb923c" },
  general: { label: "General", icon: "✦",  color: "#c084fc" },
};

// ─── Helpers ──────────────────────────────────────────────────────────
function loadMemory() {
  try { const r = localStorage.getItem(MEMORY_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function loadCustomTiers() {
  try { const r = localStorage.getItem(CUSTOM_TIERS_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
function saveCustomTiers(t) {
  try { localStorage.setItem(CUSTOM_TIERS_KEY, JSON.stringify(t)); } catch {}
}
function formatDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Section wrapper ──────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <div style={{
        color: C.textMuted, fontSize: "10px", fontFamily: "monospace",
        letterSpacing: "0.1em", textTransform: "uppercase",
        marginBottom: "12px", paddingBottom: "8px",
        borderBottom: `1px solid ${C.border}`
      }}>{title}</div>
      {children}
    </div>
  );
}

// ─── PIN Screen ───────────────────────────────────────────────────────
function PinScreen({ onUnlock }) {
  const [pin, setPin]     = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  function handleDigit(d) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === PARENT_PIN) {
          onUnlock();
        } else {
          setShake(true);
          setError(true);
          setTimeout(() => { setPin(""); setShake(false); }, 600);
        }
      }, 120);
    }
  }

  function handleBack() { setPin(p => p.slice(0, -1)); setError(false); }

  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "24px",
      backgroundImage: "radial-gradient(ellipse at 30% 40%, rgba(225,29,72,0.08) 0%, transparent 55%), radial-gradient(ellipse at 75% 70%, rgba(147,51,234,0.07) 0%, transparent 55%)"
    }}>
      <style>{`
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .pk:hover{background:rgba(240,45,122,0.15)!important;}
        .pk:active{transform:scale(0.91)!important;}
      `}</style>
      <div style={{ animation: "fadeUp 0.45s ease", textAlign: "center" }}>
        <div style={{
          width: "54px", height: "54px", borderRadius: "50%", background: C.gradMain,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px", margin: "0 auto 18px",
          boxShadow: "0 4px 24px rgba(225,29,72,0.4)"
        }}>✦</div>
        <div style={{ color: C.textPrimary, fontSize: "19px", fontFamily: "monospace",
          fontWeight: "700", letterSpacing: "0.07em", marginBottom: "4px" }}>SAGE</div>
        <div style={{ color: C.textSec, fontSize: "13px", fontFamily: "Georgia, serif",
          fontStyle: "italic", marginBottom: "38px" }}>parent dashboard</div>

        <div style={{
          display: "flex", gap: "16px", justifyContent: "center", marginBottom: "36px",
          animation: shake ? "shake 0.5s ease" : "none"
        }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: "13px", height: "13px", borderRadius: "50%",
              transition: "all 0.15s ease",
              background: pin.length > i ? (error ? C.red : C.pink) : "rgba(255,255,255,0.1)",
              border: `1px solid ${pin.length > i ? (error ? C.red : C.pink) : "rgba(255,255,255,0.18)"}`,
              boxShadow: pin.length > i && !error ? `0 0 10px ${C.pink}55` : "none",
            }} />
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 70px)", gap: "10px", justifyContent: "center" }}>
          {keys.map((d, i) => (
            <button key={i} className="pk"
              onClick={() => d === "⌫" ? handleBack() : d !== "" ? handleDigit(d) : null}
              style={{
                width: "70px", height: "70px", borderRadius: "50%",
                background: d === "" ? "transparent" : "rgba(255,255,255,0.04)",
                border: d === "" ? "none" : `1px solid ${C.border}`,
                color: d === "⌫" ? C.textSec : C.textPrimary,
                fontSize: d === "⌫" ? "18px" : "22px",
                fontFamily: "monospace", fontWeight: "500",
                cursor: d === "" ? "default" : "pointer",
                transition: "all 0.1s ease",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >{d}</button>
          ))}
        </div>

        {error && (
          <div style={{ color: C.red, fontSize: "13px", fontFamily: "Georgia, serif",
            fontStyle: "italic", marginTop: "18px" }}>Incorrect PIN — try again</div>
        )}
        <div style={{ marginTop: "40px", color: C.textMuted, fontSize: "11px",
          fontFamily: "monospace", cursor: "pointer" }}
          onClick={() => window.history.back()}>← back to sage</div>
      </div>
    </div>
  );
}

// ─── Reward progress bar ──────────────────────────────────────────────
function RewardBar({ tier, pts, unlocked }) {
  const pct  = Math.min((pts / tier.threshold) * 100, 100);
  const done = unlocked.includes(tier.id);
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ color: done ? C.pinkLight : C.textSec, fontSize: "13px", fontFamily: "monospace" }}>
          {tier.label}
        </span>
        <span style={{ color: done ? C.green : C.textMuted, fontSize: "11px", fontFamily: "monospace" }}>
          {done ? "✓ unlocked" : `${Math.min(pts, tier.threshold)} / ${tier.threshold} pts`}
        </span>
      </div>
      <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: done ? C.green : C.gradMain,
          borderRadius: "2px", transition: "width 0.7s ease"
        }} />
      </div>
    </div>
  );
}

// ─── Custom Reward Builder ────────────────────────────────────────────
function RewardBuilder({ customTiers, onChange }) {
  const empty = { label: "", threshold: "", desc: "", mission: "" };
  const [form, setForm]     = useState(empty);
  const [adding, setAdding] = useState(false);

  function add() {
    if (!form.label.trim() || !form.threshold) return;
    const updated = [...customTiers, {
      id: `custom_${Date.now()}`,
      label: form.label.trim(),
      threshold: parseInt(form.threshold),
      desc: form.desc.trim(),
      mission: form.mission.trim(),
      category: "custom",
      custom: true,
    }];
    saveCustomTiers(updated);
    onChange(updated);
    setForm(empty);
    setAdding(false);
  }

  function remove(id) {
    const updated = customTiers.filter(t => t.id !== id);
    saveCustomTiers(updated);
    onChange(updated);
  }

  const Field = ({ field, placeholder, multiline }) => {
    const style = {
      background: C.bgCard2, border: `1px solid ${C.border}`,
      borderRadius: "10px", padding: "10px 13px",
      color: C.textPrimary, fontSize: "13px", outline: "none",
      fontFamily: "Georgia, serif", fontStyle: "italic",
      width: "100%", boxSizing: "border-box",
      resize: multiline ? "vertical" : "none",
      minHeight: multiline ? "70px" : "auto",
    };
    return multiline
      ? <textarea style={style} value={form[field]} placeholder={placeholder}
          onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
      : <input type={field === "threshold" ? "number" : "text"} style={style}
          value={form[field]} placeholder={placeholder}
          onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />;
  };

  return (
    <div>
      {customTiers.length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          {customTiers.map(t => (
            <div key={t.id} style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: C.bgCard, border: `1px solid ${C.border}`,
              borderRadius: "12px", padding: "12px 14px", marginBottom: "8px"
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.textPrimary, fontSize: "13px", fontFamily: "monospace" }}>{t.label}</div>
                <div style={{ color: C.textMuted, fontSize: "11px", fontFamily: "monospace" }}>{t.threshold} pts</div>
              </div>
              <button onClick={() => remove(t.id)} style={{
                background: "none", border: `1px solid rgba(225,29,72,0.3)`,
                borderRadius: "7px", padding: "3px 10px",
                color: C.red, fontSize: "11px", cursor: "pointer", fontFamily: "monospace"
              }}>remove</button>
            </div>
          ))}
        </div>
      )}

      {!adding ? (
        <button onClick={() => setAdding(true)} style={{
          background: C.pinkSoft, border: `1px solid ${C.borderWarm}`,
          borderRadius: "10px", padding: "11px 18px",
          color: C.pinkLight, fontSize: "13px", cursor: "pointer",
          fontFamily: "monospace", width: "100%"
        }}>+ add custom reward tier</button>
      ) : (
        <div style={{
          background: C.bgCard, border: `1px solid ${C.borderWarm}`,
          borderRadius: "14px", padding: "18px", display: "flex", flexDirection: "column", gap: "10px"
        }}>
          <div style={{ color: C.pinkLight, fontSize: "10px", fontFamily: "monospace",
            letterSpacing: "0.08em", marginBottom: "2px" }}>NEW REWARD TIER</div>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 2 }}><Field field="label" placeholder="🎯 Label (e.g. 🎨 Art Supply Run)" /></div>
            <div style={{ flex: 1 }}><Field field="threshold" placeholder="Points needed" /></div>
          </div>
          <Field field="desc" placeholder="Short description (shown when she unlocks it)..." />
          <Field field="mission" placeholder="Mission — what does she have to research or do to claim this reward?..." multiline />
          <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
            <button onClick={add} style={{
              flex: 1, background: C.gradMain, border: "none",
              borderRadius: "10px", padding: "11px",
              color: "white", fontSize: "13px", cursor: "pointer", fontFamily: "monospace"
            }}>Add Tier</button>
            <button onClick={() => { setAdding(false); setForm(empty); }} style={{
              background: "none", border: `1px solid ${C.border}`,
              borderRadius: "10px", padding: "11px 16px",
              color: C.textSec, fontSize: "13px", cursor: "pointer", fontFamily: "monospace"
            }}>cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────
function Dashboard({ onLock }) {
  const [memory, setMemory]           = useState(null);
  const [customTiers, setCustomTiers] = useState([]);
  const [tab, setTab]                 = useState("overview");

  useEffect(() => {
    setMemory(loadMemory());
    setCustomTiers(loadCustomTiers());
  }, []);

  if (!memory) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex",
        alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px", padding: "40px" }}>
        <div style={{ fontSize: "36px" }}>✦</div>
        <div style={{ color: C.textPrimary, fontFamily: "monospace", fontSize: "16px" }}>No data yet</div>
        <div style={{ color: C.textSec, fontFamily: "Georgia, serif", fontStyle: "italic",
          fontSize: "14px", textAlign: "center", maxWidth: "300px", lineHeight: "1.7" }}>
          Asia hasn't started a session yet. Once she does, her progress will appear here.
        </div>
      </div>
    );
  }

  const p            = memory.profile || {};
  const pts          = memory.studyPoints || 0;
  const sessions     = memory.sessionCount || 0;
  const achievements = memory.achievements || [];
  const unlocked     = memory.unlockedRewards || [];
  const subjects     = memory.subjects || {};
  const recentTopics = memory.recentTopics || [];
  const hobbies      = Array.isArray(p.hobbies) ? p.hobbies : [];
  const allTiers     = [...REWARD_TIERS, ...customTiers].sort((a, b) => a.threshold - b.threshold);

  const tabs = ["overview", "subjects", "rewards", "achievements", "add rewards"];

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, fontFamily: "Georgia, serif",
      backgroundImage: "radial-gradient(ellipse at 0% 0%, rgba(225,29,72,0.06) 0%, transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(147,51,234,0.06) 0%, transparent 50%)"
    }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        *{scrollbar-width:thin;scrollbar-color:rgba(225,29,72,0.15) transparent}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(225,29,72,0.15);border-radius:3px}
      `}</style>

      {/* Header */}
      <div style={{
        background: "rgba(10,0,8,0.92)", borderBottom: "1px solid rgba(225,29,72,0.12)",
        padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px",
        position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(14px)"
      }}>
        <div style={{
          width: "38px", height: "38px", borderRadius: "50%", background: C.gradMain,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "16px", boxShadow: "0 2px 16px rgba(225,29,72,0.4)", flexShrink: 0
        }}>✦</div>
        <div>
          <div style={{ color: C.textPrimary, fontWeight: "700", fontSize: "16px",
            fontFamily: "monospace", letterSpacing: "0.06em" }}>SAGE</div>
          <div style={{ color: C.textMuted, fontSize: "11px", fontFamily: "monospace" }}>
            parent dashboard — {p.name || "your student"}
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button onClick={onLock} style={{
            background: "none", border: `1px solid ${C.border}`,
            borderRadius: "7px", padding: "4px 12px", color: C.textMuted,
            fontSize: "11px", cursor: "pointer", fontFamily: "monospace"
          }}>🔒 lock</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: "4px", padding: "12px 16px",
        borderBottom: `1px solid ${C.border}`, overflowX: "auto",
        background: "rgba(10,0,8,0.6)"
      }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? C.pinkSoft : "none",
            border: tab === t ? `1px solid ${C.borderWarm}` : "1px solid transparent",
            borderRadius: "8px", padding: "6px 14px",
            color: tab === t ? C.pinkLight : C.textSec,
            fontSize: "12px", cursor: "pointer", fontFamily: "monospace",
            whiteSpace: "nowrap", letterSpacing: "0.03em", transition: "all 0.15s"
          }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "28px 18px",
        animation: "fadeUp 0.35s ease" }}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <>
            {/* Profile card */}
            <div style={{
              background: C.bgCard, border: `1px solid ${C.borderWarm}`,
              borderRadius: "18px", padding: "22px 24px", marginBottom: "22px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
                <div style={{
                  width: "46px", height: "46px", borderRadius: "50%", background: C.gradWarm,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "20px", flexShrink: 0
                }}>✿</div>
                <div>
                  <div style={{ color: C.textPrimary, fontSize: "18px", fontWeight: "700",
                    fontFamily: "monospace" }}>{p.name || "Your student"}</div>
                  <div style={{ color: C.textSec, fontSize: "12px", fontFamily: "monospace" }}>
                    10th grade · Cane Bay High School
                  </div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ color: C.textMuted, fontSize: "10px", fontFamily: "monospace" }}>using sage since</div>
                  <div style={{ color: C.textSec, fontSize: "12px", fontFamily: "monospace", marginTop: "2px" }}>
                    {formatDate(memory.createdAt)}
                  </div>
                </div>
              </div>
              {hobbies.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {hobbies.map(h => (
                    <span key={h} style={{
                      background: C.purpleSoft, border: "1px solid rgba(147,51,234,0.3)",
                      borderRadius: "20px", padding: "3px 12px",
                      color: C.purpleLight, fontSize: "12px", fontFamily: "monospace"
                    }}>{h}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
              {[
                { val: sessions,          label: "sessions",       color: C.pink },
                { val: pts,               label: "study points",   color: C.purpleLight },
                { val: achievements.length, label: "achievements", color: C.green },
                { val: unlocked.length,   label: "rewards earned", color: C.amber },
              ].map(({ val, label, color }) => (
                <div key={label} style={{
                  background: C.bgCard, border: `1px solid ${C.border}`,
                  borderRadius: "16px", padding: "18px 20px", flex: 1, minWidth: "110px"
                }}>
                  <div style={{ color, fontSize: "28px", fontWeight: "700", fontFamily: "monospace" }}>{val}</div>
                  <div style={{ color: C.textPrimary, fontSize: "12px", fontFamily: "monospace", marginTop: "3px" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* School mindset */}
            <Section title="School mindset">
              <div style={{
                background: C.bgCard, border: `1px solid ${C.border}`,
                borderRadius: "14px", padding: "18px 20px"
              }}>
                <div style={{ color: C.textSec, fontSize: "13px", fontFamily: "monospace", marginBottom: "10px" }}>
                  How she described school when she set up Sage:
                </div>
                <div style={{ color: C.textPrimary, fontSize: "15px", fontFamily: "Georgia, serif",
                  fontStyle: "italic", marginBottom: "16px" }}>
                  {{ overwhelmed: "😵 Pretty overwhelmed honestly", behind: "📉 Behind and stressed about catching up",
                     okay: "🤷 Okay, could be better", ready: "💪 Ready to get stuff done" }[p.grade_feel] || p.grade_feel || "—"}
                </div>
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                  {[
                    { label: "favorite subject", val: `${SUBJECT_META[p.fav_subject]?.icon || ""} ${SUBJECT_META[p.fav_subject]?.label || p.fav_subject || "—"}` },
                    { label: "hardest subject",  val: `${SUBJECT_META[p.hard_subject]?.icon || ""} ${SUBJECT_META[p.hard_subject]?.label || p.hard_subject || "—"}` },
                    { label: "learning style",   val: { examples: "Example-first", stepbystep: "Step-by-step", explain_why: "Why before how", just_try: "Try it herself" }[p.learning_style] || "—" },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <div style={{ color: C.textMuted, fontSize: "10px", fontFamily: "monospace",
                        letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
                      <div style={{ color: C.textPrimary, fontSize: "13px", fontFamily: "monospace", marginTop: "4px" }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* Recent topics */}
            {recentTopics.length > 0 && (
              <Section title="Recently worked on">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {recentTopics.map((t, i) => {
                    const m = SUBJECT_META[t] || { label: t, icon: "✦", color: C.purpleLight };
                    return (
                      <span key={i} style={{
                        background: C.bgCard, border: `1px solid ${C.border}`,
                        borderRadius: "20px", padding: "6px 16px",
                        color: m.color, fontSize: "13px", fontFamily: "monospace"
                      }}>{m.icon} {m.label}</span>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Next reward */}
            <Section title="Next reward she's working toward">
              {(() => {
                const next = allTiers.find(t => !unlocked.includes(t.id));
                if (!next) return (
                  <div style={{ color: C.green, fontFamily: "monospace", fontSize: "14px" }}>
                    🌟 She's unlocked everything! Add new tiers in the "add rewards" tab.
                  </div>
                );
                const pct       = Math.min((pts / next.threshold) * 100, 100);
                const remaining = Math.max(next.threshold - pts, 0);
                return (
                  <div style={{
                    background: C.bgCard, border: `1px solid ${C.borderWarm}`,
                    borderRadius: "14px", padding: "18px 20px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div style={{ color: C.textPrimary, fontSize: "14px", fontFamily: "monospace" }}>{next.label}</div>
                      <div style={{ color: C.textSec, fontSize: "12px", fontFamily: "monospace" }}>{remaining} pts to go</div>
                    </div>
                    <div style={{ height: "5px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: C.gradMain,
                        borderRadius: "3px", transition: "width 0.8s ease" }} />
                    </div>
                    {next.mission && (
                      <div style={{ marginTop: "14px", background: C.pinkSoft,
                        border: `1px solid ${C.borderWarm}`, borderRadius: "10px", padding: "13px 15px" }}>
                        <div style={{ color: C.pink, fontSize: "10px", fontFamily: "monospace",
                          letterSpacing: "0.08em", marginBottom: "6px" }}>HER MISSION TO UNLOCK THIS</div>
                        <div style={{ color: C.textPrimary, fontSize: "13px",
                          fontFamily: "Georgia, serif", fontStyle: "italic", lineHeight: "1.65" }}>
                          {next.mission}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </Section>
          </>
        )}

        {/* ── SUBJECTS ── */}
        {tab === "subjects" && (
          <Section title="Subject breakdown">
            {Object.keys(subjects).length === 0 ? (
              <div style={{ color: C.textSec, fontFamily: "Georgia, serif",
                fontStyle: "italic", fontSize: "14px", lineHeight: "1.7" }}>
                No subject data yet. She'll build this up as she uses Sage.
              </div>
            ) : (
              Object.entries(subjects)
                .sort(([,a],[,b]) => (b.sessions||0) - (a.sessions||0))
                .map(([subj, data]) => {
                  const m = SUBJECT_META[subj] || { label: subj, icon: "✦", color: C.purpleLight };
                  const count = data.sessions || 0;
                  const max   = Math.max(...Object.values(subjects).map(s => s.sessions || 0), 1);
                  return (
                    <div key={subj} style={{
                      background: C.bgCard, border: `1px solid ${C.border}`,
                      borderRadius: "14px", padding: "16px 18px", marginBottom: "10px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                        <span style={{ fontSize: "18px" }}>{m.icon}</span>
                        <span style={{ color: m.color, fontFamily: "monospace", fontSize: "14px" }}>{m.label}</span>
                        <span style={{ marginLeft: "auto", color: C.textMuted, fontSize: "12px", fontFamily: "monospace" }}>
                          {count} session{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div style={{ height: "3px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(count/max)*100}%`,
                          background: m.color, borderRadius: "2px", opacity: 0.7 }} />
                      </div>
                    </div>
                  );
                })
            )}
          </Section>
        )}

        {/* ── REWARDS ── */}
        {tab === "rewards" && (
          <Section title="All reward tiers">
            <div style={{
              background: C.bgCard, border: `1px solid ${C.border}`,
              borderRadius: "16px", padding: "20px 22px"
            }}>
              {allTiers.map(tier => (
                <RewardBar key={tier.id} tier={tier} pts={pts} unlocked={unlocked} />
              ))}
            </div>
          </Section>
        )}

        {/* ── ACHIEVEMENTS ── */}
        {tab === "achievements" && (
          <Section title="Achievements">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {ACHIEVEMENTS.map(a => {
                const earned = achievements.includes(a.id);
                return (
                  <div key={a.id} style={{
                    background: earned ? C.pinkSoft : C.bgCard,
                    border: `1px solid ${earned ? C.borderWarm : C.border}`,
                    borderRadius: "14px", padding: "14px 18px",
                    display: "flex", alignItems: "center", gap: "12px",
                    opacity: earned ? 1 : 0.4, transition: "opacity 0.2s"
                  }}>
                    <div style={{ fontSize: "20px" }}>{earned ? "🏆" : "○"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: earned ? C.textPrimary : C.textSec,
                        fontSize: "14px", fontFamily: "monospace" }}>{a.label}</div>
                      <div style={{ color: C.textMuted, fontSize: "12px",
                        fontFamily: "monospace", marginTop: "2px" }}>{a.desc}</div>
                    </div>
                    <div style={{ color: earned ? C.pink : C.textMuted,
                      fontSize: "12px", fontFamily: "monospace" }}>+{a.points} pts</div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── ADD REWARDS ── */}
        {tab === "add rewards" && (
          <>
            <Section title="Custom reward tiers">
              <div style={{ color: C.textSec, fontSize: "13px", fontFamily: "Georgia, serif",
                fontStyle: "italic", marginBottom: "16px", lineHeight: "1.7" }}>
                Add your own rewards on top of the built-in ones. Set a point threshold and a mission she has to complete to claim it — she'll see it appear in her reward progress automatically.
              </div>
              <RewardBuilder customTiers={customTiers} onChange={setCustomTiers} />
            </Section>

            <Section title="Built-in tiers (for reference)">
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {REWARD_TIERS.map(t => (
                  <div key={t.id} style={{
                    background: C.bgCard, border: `1px solid ${C.border}`,
                    borderRadius: "12px", padding: "12px 16px",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                    <span style={{ color: C.textPrimary, fontSize: "13px", fontFamily: "monospace" }}>{t.label}</span>
                    <span style={{ color: C.textMuted, fontSize: "12px", fontFamily: "monospace" }}>{t.threshold} pts</span>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  ROOT EXPORT — auto-locks after 15 min inactivity
// ═══════════════════════════════════════════════════════════════════
export default function ParentDashboard() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!unlocked) return;
    let timer = setTimeout(() => setUnlocked(false), 15 * 60 * 1000);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setUnlocked(false), 15 * 60 * 1000);
    };
    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
    };
  }, [unlocked]);

  if (!unlocked) return <PinScreen onUnlock={() => setUnlocked(true)} />;
  return <Dashboard onLock={() => setUnlocked(false)} />;
}

// ═══════════════════════════════════════════════════════════════════
//  WIRING INSTRUCTIONS
// ═══════════════════════════════════════════════════════════════════
//
//  STEP 1 — Replace src/main.jsx with this:
//  ─────────────────────────────────────────
//  import { StrictMode } from "react";
//  import { createRoot } from "react-dom/client";
//  import SageV4 from "./App.jsx";
//  import ParentDashboard from "./ParentDashboard.jsx";
//
//  function Root() {
//    const isParent = window.location.pathname.startsWith("/parent");
//    return isParent ? <ParentDashboard /> : <SageV4 />;
//  }
//
//  createRoot(document.getElementById("root")).render(
//    <StrictMode><Root /></StrictMode>
//  );
//
//
//  STEP 2 — Create vercel.json in the root of your repo:
//  ──────────────────────────────────────────────────────
//  {
//    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
//  }
//
//  This makes /parent not 404 on refresh.
//
//
//  STEP 3 — Change PARENT_PIN at the top of this file to your PIN.
//
//  STEP 4 — Push to main → Vercel auto-deploys.
//  Visit: https://www.sage-ai-4-ladypie.com/parent
