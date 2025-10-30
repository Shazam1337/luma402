import React, { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer
} from "recharts";


declare global {
  interface Window {
    solana?: any;
  }
}

/**
 * 402 Network — Terminal Style Dashboard (React, no external deps)
 * Full version with:
 * - Continuous verbose simulation (1 log/sec)
 * - KPI drift (2s), New pending (3s), Fee claims (5s), Top shuffle (15s)
 * - Pending -> Verified -> Paid pipeline
 * - Lower row (Pending / Fee Claims / System Log) equal column heights
 */

// ---- Helpers ----
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const randint = (min: number, max: number) => Math.floor(rand(min, max + 1));
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

// ---- Seeds ----
const HANDLES = [
   "@alexmiles", "@sofiadream", "@cryptoandrew", "@mikeonchain", "@luna_k", "@artem.sol",
  "@elena_nodes", "@tomsierra", "@valeri_eth", "@dennyspark", "@katychain", "@leohunt",
  "@maximsol", "@olga_wave", "@petr_crypto", "@irinaflow", "@markfusion", "@yuliax",
  "@nikbyte", "@maria_nft", "@joshdefi", "@sergeytrader", "@anastasiax", "@timonmeta",
  "@ekaterina_io", "@johnlumen", "@vladblock", "@arielcodes", "@andrey_rune",
  "@sofiachain", "@antonmirror", "@alicecrypto", "@dimaonfire", "@lizaweb3",
  "@borisnode", "@emilyverse", "@nikolaschain", "@arturstorm", "@kateweb3",
  "@maxdevx", "@irinanode", "@solian", "@andrewnova", "@valya_ai", "@leonmetaverse",
  "@stasbyte", "@taniachain", "@cryptoalex", "@mariadefi", "@danielsol", "@evgeniyblock",
  "@alisa_io", "@romanmeta", "@kseniawave", "@nataliaflow", "@ivantrader",
  "@mikhailsol", "@sophiabyte", "@victorcore", "@ksenonode", "@olegstream",
  "@cryptoemilia", "@anthoncode", "@lara_defi", "@dariasol", "@andrebyte",
  "@paulchain", "@veronika_io", "@ilyaweb3", "@martin.sol"
];


export default function App() {

    const [walletAddress, setWalletAddress] = useState<string | null>(null);
const [showNotif, setShowNotif] = useState(false);

    // --- Chart State (Live Post Growth) ---
const [chartData, setChartData] = useState<{ time: string; posts: number }[]>([]);
const [totalPosts, setTotalPosts] = useState(0);

useEffect(() => {
  let start = Date.now();
  const iv = setInterval(() => {
    setTotalPosts((prev) => {
      const next = prev + randint(1, 2); // плавный рост
      const elapsed = Math.floor((Date.now() - start) / 1000); // сек с начала
      const label = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`; // время в мин:сек
      setChartData((prevData) => {
        const updated = [...prevData, { time: label, posts: next }].slice(-60); // последние 60 точек (≈ час)
        return updated;
      });
      return next;
    });
  }, randint(500, 1000)); // обновление каждые 0.5–1 сек
  return () => clearInterval(iv);
}, []);


async function connectPhantom() {
  const provider = window.solana;

  if (provider && provider.isPhantom) {
    try {
      const resp = await provider.connect();
      setWalletAddress(resp.publicKey.toString());
    } catch (err) {
      console.error("User rejected connection:", err);
    }
  } else {
    alert("Phantom wallet not found! Please install it from https://phantom.app/");
  }
}

    // KPI
  const [stats, setStats] = useState({ totalUnclaimed: 0.0, totalCreator: 0.0, totalTx: 28, totalPaid: 0.56 });
  // Tables
  const [recent, setRecent] = useState(
    [
      { id: 1, handle: "@cryptojane", action: "mention", sol: 0.0209, ago: "2m", status: "Paid" },
      { id: 2, handle: "@btrusk", action: "retweet", sol: 0.0408, ago: "6m", status: "Paid" },
      { id: 3, handle: "@dernecos", action: "mention", sol: 0.0408, ago: "15m", status: "Paid" },
    ] as { id: number; handle: string; action: string; sol: number; ago: string; status: string }[]
  );
  const [top, setTop] = useState(
    [
      { rank: 1, handle: "@alpabt", sol: 0.0600, reps: 3 },
      { rank: 2, handle: "@btrunk", sol: 0.0400, reps: 2 },
      { rank: 3, handle: "@domutsol", sol: 0.0400, reps: 2 },
      { rank: 4, handle: "@ejuwara", sol: 0.0400, reps: 3 },
      { rank: 5, handle: "@Alamsiamm", sol: 0.0400, reps: 2 },
    ] as { rank: number; handle: string; sol: number; reps: number }[]
  );
  const [pending, setPending] = useState(
    [
      { id: "p1", handle: "@qablyla", progress: 47, status: "Pending" },
      { id: "p2", handle: "@ArmanionDa", progress: 33, status: "Pending" },
    ] as { id: string; handle: string; progress: number; status: string }[]
  );
  const [claims, setClaims] = useState(
    [
      { id: "c1", sol: 0.008151, ts: "27.10.2025 23:00:03" },
      { id: "c2", sol: 0.001046, ts: "27.10.2025 23:00:10" },
    ] as { id: string; sol: number; ts: string }[]
  );

  const [log, setLog] = useState<string[]>([
    "boot: 402-term v1.0",
    "link: solana mainnet (mock)",
    "hint: type 'help' or use the panels below",
  ]);
  const [heartbeat, setHeartbeat] = useState(true);
  const logRef = useRef<HTMLPreElement | null>(null);
  const pendingRef = useRef<HTMLUListElement | null>(null);

  // Form
  const [form, setForm] = useState({ handle: "", url: "", wallet: "" });

  // --- Actions ---
function submitForm() {
  if (!form.handle || !form.url || !form.wallet) {
    pushLog("[err] missing fields — handle, url, wallet");
    return;
  }

  newPending(form.handle);
  pushLog(`[info] submit: queued ${form.handle} → ${form.url}`);

  // показать уведомление
  setShowNotif(true);

  // скрыть через 4 секунды
  setTimeout(() => {
    setShowNotif(false);
  }, 4000);

  setForm({ handle: "", url: "", wallet: "" });
}



  function newPending(handle?: string) {
    const id = Math.random().toString(36).slice(2, 8);
    const h = handle || pick(HANDLES);
    setPending((p) => [{ id, handle: h, progress: 0, status: "Pending" }, ...p]); // НЕ обрезаем — пусть уходит вниз
    setTimeout(() => updatePending(id, randint(20, 40)), randint(1000, 2000));
    setTimeout(() => updatePending(id, randint(55, 75)), randint(4000, 6000));
    setTimeout(() => updatePending(id, randint(85, 95)), randint(8000, 10000));
    setTimeout(() => verifyAndPay(id, h), randint(12000, 15000)); // финальный переход
  }

  function updatePending(id: string, progress: number) {
    setPending((p) => p.map((row) => (row.id === id ? { ...row, progress } : row)));
  }

  function verifyAndPay(id: string, h?: string) {
    setPending((p) => p.map((x) => (x.id === id ? { ...x, progress: 100, status: "Verified" } : x)));
    const earned = +(rand(0.005, 0.055)).toFixed(4);
    const handle = h || `@${id}`;
    setRecent((r) => [{ id: Date.now(), handle, action: "mention", sol: earned, ago: "now", status: "Paid" }, ...r].slice(0, 20));
    setStats((s) => ({
      ...s,
      totalTx: s.totalTx + 1,
      totalPaid: +(s.totalPaid + earned).toFixed(4),
      totalCreator: +(s.totalCreator + earned * 0.1).toFixed(4),
    }));
    setClaims((c) => [{ id: "c" + id, sol: earned, ts: new Date().toLocaleString() }, ...c].slice(0, 30));
    setTop((t) => {
      const idx = t.findIndex((x) => x.handle === handle);
      if (idx >= 0) t[idx] = { ...t[idx], sol: +(t[idx].sol + earned).toFixed(4), reps: t[idx].reps + 1 };
      else t.push({ rank: t.length + 1, handle, sol: earned, reps: 1 });
      const sorted = [...t].sort((a, b) => b.sol - a.sol).slice(0, 5).map((x, i) => ({ ...x, rank: i + 1 }));
      return sorted;
    });
    pushLog(`[ok] verify: ${handle} → +${earned} SOL [Paid]`);
  }

  function pushLog(line: string) {
    setLog((l) => [...l.slice(-199), time() + " " + line]);
  }
  function time() {
    const d = new Date();
    const pad = (n: number) => (n < 10 ? "0" + n : String(n));
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  // --- Effects ---
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);
  //useEffect(() => { if (pendingRef.current) pendingRef.current.scrollTop = pendingRef.current.scrollHeight; }, [pending]);

  // Heartbeat (1s)
  useEffect(() => {
    const iv = setInterval(() => setHeartbeat((h) => !h), 1000);
    return () => clearInterval(iv);
  }, []);

  // Verbose log stream (1/sec)
  useEffect(() => {
    const VERBS = ["submit","verify","mint","claim","sync","ping","cache","fetch","recalc","update"] as const;
    const iv = setInterval(() => {
      const v = pick([...VERBS]);
      const h = pick(HANDLES);
      if (v === "submit") pushLog(`[info] submit: ${h} queued`);
      else if (v === "verify") pushLog(`[ok] verify: ${h} proof attested`);
      else if (v === "mint") pushLog(`[ok] mint: badge#402${randint(100, 999)} for ${h}`);
      else if (v === "claim") pushLog(`[ok] claim: creator vault +${rand(0.0005, 0.003).toFixed(4)} SOL`);
      else if (v === "sync") pushLog(`[sys] sync: on-chain registry updated`);
      else if (v === "ping") pushLog(`[sys] ping: node-${randint(1, 4)} latency ${randint(12, 40)}ms`);
      else if (v === "cache") pushLog(`[sys] cache: feed warm ${randint(85, 99)}%`);
      else if (v === "fetch") pushLog(`[sys] fetch: twitter batch ${randint(200, 600)} items`);
      else if (v === "recalc") pushLog(`[sys] recalc: top raiders`);
      else if (v === "update") pushLog(`[sys] update: dashboard metrics`);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // KPI drift (every 2s)
  useEffect(() => {
    const iv = setInterval(() => {
      setStats((s) => {
        const txInc = randint(1, 3);
        const paidInc = +rand(0.001, 0.03).toFixed(4);
        const unclaimedDrift = +rand(-0.002, 0.004).toFixed(4);
        const creatorInc = +(paidInc * 0.1).toFixed(4);
        return {
          totalTx: s.totalTx + txInc,
          totalPaid: +(s.totalPaid + paidInc).toFixed(4),
          totalUnclaimed: Math.max(0, +(s.totalUnclaimed + unclaimedDrift).toFixed(4)),
          totalCreator: +(s.totalCreator + creatorInc).toFixed(4),
        };
      });
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  // New pending tasks (every ~3s)
  useEffect(() => {
    const iv = setInterval(() => newPending(), 3000);
    return () => clearInterval(iv);
  }, []);

  // Fee claims (every 5s)
  useEffect(() => {
    const iv = setInterval(() => {
      const amt = +rand(0.0005, 0.006).toFixed(6);
      setClaims((c) => [{ id: "c" + Math.random().toString(36).slice(2, 8), sol: amt, ts: new Date().toLocaleString() }, ...c].slice(0, 30));
      pushLog(`[ok] claim: creator vault +${amt.toFixed(6)} SOL`);
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  // Top shuffle (every 15s)
  useEffect(() => {
    const iv = setInterval(() => {
      setTop((t) => {
        const bumped = t.map((x) => ({ ...x, sol: +(x.sol + rand(0.0005, 0.01)).toFixed(4) }));
        const sorted = bumped.sort((a, b) => b.sol - a.sol).slice(0, 5).map((x, i) => ({ ...x, rank: i + 1 }));
        return sorted;
      });
      pushLog(`[sys] recalc: top raiders`);
    }, 15000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="term-root">
      <style>{css}</style>

      {/* Header bar */}
      {/* Header bar */}

<div className="bar new-bar">
  <div className="left">
    <div className="logo">
  <div className="orb">
    <svg width="36" height="36" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00ff9c" />
          <stop offset="50%" stopColor="#4ae8ff" />
          <stop offset="100%" stopColor="#a855f7" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="30" fill="url(#orbGlow)" opacity="0.95" />
    </svg>
  </div>
  <span className="brand-text">LUMA402</span>
</div>

  </div>

  <div className="right">
       <a
      href="https://x.com/LUMA402"
      target="_blank"
      rel="noopener noreferrer"
      className="x-link"
      title="Follow us on X"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 1200 1227"
        xmlns="http://www.w3.org/2000/svg"
        fill="url(#xGradient)"
      >
        <defs>
          <linearGradient id="xGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00FF9C" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        <path d="M714.163 519.284L1160.89 0H1058.44L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H102.443L514.601 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM568.931 687.828L520.031 618.918L139.418 79.6943H306.615L613.819 519.284L662.719 588.194L1058.47 1146.68H891.271L568.931 687.828Z" />
      </svg>
    </a>
    <button className="connect-btn" onClick={connectPhantom}>
      {walletAddress
        ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
        : "Connect Phantom"}
    </button>
    <div className="status">
      <span className="sys">SYSTEM:</span>
      <b>ONLINE</b>
      <span className={heartbeat ? "dot on" : "dot"}>●</span>
    </div>
  </div>
</div>





        <div className="sidebar-intro">
  <div className="intro-card">
    <h2>$LUMA402</h2>
    <p>
      The attention-to-light (earn) layer on <b>Solana backed by 402</b>.
      Every signal — a transaction of focus,
      every mention — a transfer of light.
    </p>
    <p>
      LUMA transforms user attention into measurable value.
      Each interaction powers the network —
      creating a decentralized economy of motion and intent.
    </p>
    <p className="motto">Turn Attention into Light.</p>
  </div>

</div>



      {/* KPI Row */}
      <div className="container grid kpi">
        <Box title="TOTAL UNCLAIMED FEES" value={`${stats.totalUnclaimed.toFixed(4)} SOL`} />
        <Box title="TOTAL CREATOR REWARDS" value={`${stats.totalCreator.toFixed(4)} SOL`} />
        <Box title="TOTAL TRANSACTIONS" value={`${stats.totalTx} tx`} />
        <Box title="TOTAL PAID OUT" value={`${stats.totalPaid.toFixed(4)} SOL`} />
      </div>

      {/* Main Row */}
      <div className="container grid main">
        <Panel title="SUBMIT POST & EARN">
          <Field label="Twitter Handle" placeholder="@username" value={form.handle} onChange={(v) => setForm({ ...form, handle: v })} />
          <Field label="Tweet URL" placeholder="https://x.com/run402_fun" value={form.url} onChange={(v) => setForm({ ...form, url: v })} />
          <Field label="Solana Wallet Address" placeholder="Enter your SOL address" value={form.wallet} onChange={(v) => setForm({ ...form, wallet: v })} />
          <div className="row">
            <button
  type="button"
  className="btn"
  onClick={(e) => {
    e.preventDefault();
    submitForm();
  }}
>
  submit
</button>

          </div>
          <ul className="req">
            <li>must mention CA or $LUMA402 in tweet</li>
            <li>verification runs every ~1 minute</li>
            <li>payment sent automatically via creator fees by 402</li>
          </ul>

             {/* ГРАФИК ПОД ФОРМОЙ */}
  <div className="chart-box" style={{ marginTop: "20px" }}>
  <div className="chart-header">
    <div className="chart-title">POST COUNT by 402</div>
    <div className="chart-value">{totalPosts}</div>
  </div>

  <ResponsiveContainer width="100%" height={180}>
    <LineChart data={chartData}>
      <XAxis dataKey="time" tick={{ fill: "#88bba4", fontSize: 10 }} />
      <YAxis hide domain={["auto", "auto"]} />
      <Line
        type="monotone"
        dataKey="posts"
        stroke="#00ff9c"
        strokeWidth={2}
        dot={false}
        isAnimationActive={false}
        animationDuration={400}
        animationEasing="linear"
      />
    </LineChart>
  </ResponsiveContainer>
</div>


        </Panel>



        <Panel title="RECENT PAID POSTS">
  <div className="table-wrapper">
    <table className="table">
      <thead>
        <tr>
          <th>HANDLE</th>
          <th>STATUS</th>
          <th className="tr">REWARD</th>
        </tr>
      </thead>
      <tbody>
        {recent.map((r) => (
          <tr key={r.id}>
            <td>{r.handle}</td>
            <td className={r.status === "Paid" ? "ok" : ""}>{r.status}</td>
            <td className="tr">+{r.sol.toFixed(4)} SOL</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</Panel>


        <Panel title="TOP 5 POSTERS">
          <table className="table">
            <thead><tr><th>#</th><th>handle</th><th className="tr">total (SOL)</th></tr></thead>
            <tbody>
              {top.map((t) => (<tr key={t.rank}><td>#{t.rank}</td><td>{t.handle} <span className="dim">({t.reps} reps)</span></td><td className="tr">{t.sol.toFixed(4)}</td></tr>))}
            </tbody>
          </table>
        </Panel>
      </div>

      {/* Lower Row (equal heights) */}
      <div className="container grid foot">
          <Panel title="PENDING VERIFICATIONS">
  <div className="scrollable">
    <ul ref={pendingRef} className="pending">
      {pending.map((p) => (
        <li key={p.id}>
          <span className="ok">●</span> {p.handle} —
          <span className="dim">{p.status}</span>
          <span className="barp">
            <i style={{ width: p.progress + "%" }} />
          </span>
          {p.progress}%
        </li>
      ))}
      {!pending.length && <li className="dim">no pending submissions</li>}
    </ul>
  </div>
</Panel>


        <Panel title="FEE CLAIMS">
  <div className="scrollable">
    <ul className="claims">
      {claims.map((c) => (
        <li key={c.id}>
          <b>{c.sol.toFixed(6)} SOL</b> <span className="dim">— {c.ts}</span>
        </li>
      ))}
    </ul>
  </div>
</Panel>


        <Panel title="SYSTEM LOG">
  <div className="scrollable">
    <pre ref={logRef} className="log">{log.join("\n")}</pre>
  </div>
</Panel>
{showNotif && (
  <div className="notif">
    verification in pending...
  </div>
)}
      </div>

      <div className="footer container">© {new Date().getFullYear()} LUMA402  —  Attention-to-Light</div>
    </div>
  );
}

// --- UI Bits ---
function Box({ title, value }: { title: string; value: string }) {
  return (
    <div className="box fadein">
      <div className="title">{title}</div>
      <div className="val">{value}</div>
    </div>
  );
}
function Panel({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <section className="panel fadein">
      <div className="panel-title">{title}</div>
      <div className="panel-body">{children}</div>
    </section>
  );
}
function Field({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; }) {
  return (
    <label className="field">
      <span className="lab">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

// --- CSS ---
const css = `
:root {
  --bg: #f6fbff;
  --fg: #111;
  --dim: #555;
  --ok: #00a86b;
  --err: #ff5c5c;
  --line: #e6e9ec;
  --edge: rgba(0,0,0,0.06);
  --glow1: #00ff9c;
  --glow2: #a855f7;
}

.term-root {
  background: linear-gradient(180deg, #f9fbfc 0%, #eef3f6 100%);
  color: #222;
  min-height: 100vh;
  font: 15px/1.45 "Inter", ui-sans-serif, system-ui;
}


.container {
  max-width: 1600px; /* было 1200px */
  margin: 0 auto;
  padding: 0 32px; /* больше воздуха по бокам */
}

/* ─ Header ─ */
.bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--edge);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
}
.brand { letter-spacing:.15em; color: #111; }
.status b { color: var(--ok); }
.status .dot { margin-left:8px; color:#aaa; transition: color .25s ease; }
.status .dot.on { color: var(--ok); text-shadow:0 0 6px rgba(0,168,107,.4); }

/* ─ Layout ─ */
.prompt { padding:24px 0 8px; color:#444; }
.line { display:flex; gap:8px; align-items:center; white-space:nowrap; overflow:auto; }
.path { color:#777; }
.gt { color:#00a86b; }
.cmd { color:#222; font-weight:500; }
.caret { color:#888; margin-left:6px; animation: caretBlink 1.2s infinite; }
@keyframes caretBlink { 0%,100%{opacity:1;} 50%{opacity:.2;} }

.grid { display:grid; gap:18px; }
.kpi { grid-template-columns:repeat(4,1fr); padding:18px 0 8px; }
.main { grid-template-columns:1.1fr 1fr 0.9fr; padding:10px 0; }
.foot { grid-template-columns:1.1fr 0.9fr 1fr; padding:10px 0 40px; align-items:stretch; }

/* ─ Boxes & panels ─ */
.box, .panel {
  background: rgba(255,255,255,0.55);
  border: 1px solid var(--edge);
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.04);
  backdrop-filter: blur(12px);
  color: var(--fg);
}
.box { padding:14px; }
.box .title { color: var(--dim); font-size:12px; letter-spacing:.08em; }
.box .val { margin-top:6px; font-size:26px; font-weight:600; background: linear-gradient(90deg,var(--glow1),var(--glow2)); -webkit-background-clip:text; color:transparent; }

.panel { display:flex; flex-direction:column; height:100%; }
.panel-title {
  padding:10px 12px;
  border-bottom:1px solid var(--line);
  color:#333;
  font-weight:600;
  letter-spacing:.08em;
}
.panel-body { padding:12px; flex:1; display:flex; flex-direction:column; }

/* ─ Forms ─ */
.field { display:flex; flex-direction:column; gap:6px; margin-bottom:10px; }
.lab { color: var(--dim); }
input {
  background: rgba(255,255,255,0.8);
  border:1px solid var(--edge);
  border-radius:10px;
  color:#111;
  padding:10px 12px;
  outline:none;
}
input:focus {
  border-color: var(--glow2);
  box-shadow: 0 0 0 2px rgba(168,85,247,0.25);
}
.row { display:flex; align-items:center; gap:10px; }
.btn {
  background: linear-gradient(90deg,var(--glow1),var(--glow2));
  color:white;
  border:none;
  padding:8px 16px;
  border-radius:8px;
  cursor:pointer;
  transition:.25s;
}
.btn:hover { opacity:.85; transform:translateY(-1px); }

.req { list-style:none; margin:10px 0 0; padding:0; color:var(--dim); }
.req li { margin:2px 0; }

/* ─ Tables ─ */
.table { width:100%; border-collapse:separate; border-spacing:0; }
.table th {
  font-weight:600;
  color:#333;
  border-bottom:1px solid var(--line);
  padding:8px 6px;
  text-transform:uppercase;
  font-size:12px;
}
.table td {
  padding:10px 8px;
  border-bottom:1px solid var(--line);
}
.tr { text-align:right; }
.ok { color: var(--ok); font-weight:600; }
.dim { color: var(--dim); }

/* ─ Progress bars, claims, logs ─ */
.pending li, .claims li {
  display:flex; align-items:center; gap:8px;
  padding:6px 0; border-bottom:1px solid var(--line);
}
.barp {
  flex:1; height:8px; background:rgba(0,0,0,.06);
  border-radius:4px; margin:0 8px; overflow:hidden;
}
.barp i {
  display:block; height:100%;
  background:linear-gradient(90deg,var(--glow1),var(--glow2));
  border-radius:3px;
}

.log {
  background: rgba(255,255,255,0.6);
  border: 1px solid var(--edge);
  border-radius: 10px;
  padding:10px;
  color:#333;
  font-size:12px;
  line-height:1.4;
  white-space:pre-wrap;
  overflow:auto;
}

.footer {
  padding:12px 0 30px;
  color:#777;
  border-top:1px solid var(--line);
  text-align:center;
  font-size:13px;
  margin-top:24px;
}

@media (max-width:1080px){
  .main{grid-template-columns:1fr;}
  .foot{grid-template-columns:1fr;}
  .kpi{grid-template-columns:1fr 1fr;}
}
@media (max-width:640px){ .kpi{grid-template-columns:1fr;} }
/* === LUMA402 HEADER === */
.new-bar .right {
  display: flex;
  align-items: center;
  gap: 18px;
}

/* --- X (Twitter) icon --- */
.new-bar .x-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08), 0 0 10px rgba(0, 255, 156, 0.2);
  transition: all 0.25s ease;
}
.new-bar .x-link:hover {
  transform: translateY(-2px) scale(1.12);
  box-shadow: 0 4px 18px rgba(168, 85, 247, 0.4),
              0 0 8px rgba(0, 255, 156, 0.4);
}
.new-bar .x-link svg {
  width: 20px;
  height: 20px;
  filter: drop-shadow(0 0 4px rgba(0,255,156,0.5));
}

/* --- Connect Phantom button --- */
.new-bar .connect-btn {
  background: white;
  color: #333;
  border: 2px solid transparent;
  background-image: linear-gradient(#fff, #fff),
    linear-gradient(90deg, #00ff9c, #a855f7);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  padding: 10px 22px;
  border-radius: 12px;
  font-weight: 500;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.25s ease;
}
.new-bar .connect-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(168, 85, 247, 0.25);
}

/* --- Status text --- */
.new-bar .status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #777;
  margin-left: 6px;
  font-family: "Space Grotesk", sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.new-bar .status b {
  color: #00b97f;
  font-weight: 600;
}
.new-bar .status .dot {
  font-size: 12px;
  color: #bbb;
}
.new-bar .status .dot.on {
  color: #00ff9c;
  text-shadow: 0 0 6px rgba(0,255,156,0.6);
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo .orb {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: orbPulse 4s ease-in-out infinite;
  filter: drop-shadow(0 0 12px rgba(82, 255, 206, 0.6));
}

@keyframes orbPulse {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 10px rgba(82, 255, 206, 0.4));
  }
  50% {
    transform: scale(1.08);
    filter: drop-shadow(0 0 22px rgba(168, 85, 247, 0.5));
  }
}

.brand-text {
  font-family: "Space Grotesk", "Inter", sans-serif;
  font-weight: 600;
  font-size: 20px;
  letter-spacing: 0.04em;
  color: #1a1a1a;
  background: linear-gradient(90deg, #00ff9c, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 12px rgba(82, 255, 206, 0.15);
}
/* --- Sidebar intro block --- */
.sidebar-intro {
  position: absolute;
  top: 120px;
  left: 40px;
  width: 300px;
  padding: 20px 24px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  color: #1a1a1a;
}

.intro-card h2 {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.02em;
  background: linear-gradient(90deg, #00ff9c, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 12px;
}

.intro-card p {
  font-size: 15px;
  line-height: 1.55;
  margin: 10px 0;
  color: #333;
}

.intro-card .motto {
  margin-top: 18px;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.05em;
  color: #00b97f;
  text-transform: uppercase;
}
/* --- Token badge --- */
.token-badge {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.ticker {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #00ff9c;
  text-shadow:
    0 0 8px rgba(0, 255, 156, 0.5),
    0 0 14px rgba(168, 85, 247, 0.4);
  animation: tickerPulse 2.4s ease-in-out infinite;
  cursor: default;
  background: linear-gradient(90deg, #00ff9c, #4ae8ff, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

@keyframes tickerPulse {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 8px rgba(0, 255, 156, 0.3));
    opacity: 0.9;
  }
  50% {
    transform: scale(1.05);
    filter: drop-shadow(0 0 18px rgba(168, 85, 247, 0.6));
    opacity: 1;
  }
}
.intro-card {
  display: flex;
  flex-direction: column;
  align-items: center; /* центрирует весь контент по горизонтали */
  text-align: center; /* выравнивает текст */
}

.intro-card h2 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.03em;
  background: linear-gradient(90deg, #00ff9c, #4ae8ff, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;
  animation: tickerSimplePulse 2.8s ease-in-out infinite;
  text-align: center;
}

@keyframes tickerSimplePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}
/* --- Scrollable table area --- */
.table-wrapper {
  max-height: 720px; /* ограничение по высоте под ~20 записей */
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 255, 156, 0.4) transparent;
}

.table-wrapper::-webkit-scrollbar {
  width: 6px;
}
.table-wrapper::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #00ff9c, #a855f7);
  border-radius: 3px;
}
.table-wrapper::-webkit-scrollbar-track {
  background: transparent;
}
/* --- Scrollable lower panels (pending, claims, logs) --- */
.scrollable {
  max-height: 420px; /* одинаковая высота для всех трёх панелей */
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 255, 156, 0.4) transparent;
}

.scrollable::-webkit-scrollbar {
  width: 6px;
}
.scrollable::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #00ff9c, #a855f7);
  border-radius: 3px;
}
.scrollable::-webkit-scrollbar-track {
  background: transparent;
}
.chart-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 0 4px;
}

.chart-title {
  color: var(--fg);
  font-size: 16px;
  letter-spacing: 0.05em;
}

.chart-value {
  color: #00ffc3;
  font-weight: 600;
  font-size: 28px;
  font-family: ui-monospace, monospace;
}

.notif {
  position: fixed;
  bottom: 40px;
  right: 40px;
  background: rgba(0, 255, 195, 0.1);
  border: 1px solid #00ffc3;
  color: #00ffc3;
  padding: 14px 22px;
  border-radius: 12px;
  font-family: ui-monospace, monospace;
  font-size: 14px;
  letter-spacing: 0.05em;
  box-shadow: 0 0 20px rgba(0,255,195,0.15);
  animation: fadeInOut 4s ease-in-out;
  pointer-events: none;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(10px); }
  10%, 90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(10px); }
}

.notif-caret {
  margin-right: 6px;
  color: #00ffc3;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}


`;

