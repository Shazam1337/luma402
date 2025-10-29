import React, { useEffect, useRef, useState } from "react";

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

<div className="bar">
  <div className="brand">
  <svg width="120" height="40" viewBox="0 0 180 60" xmlns="http://www.w3.org/2000/svg">
    <rect width="180" height="60" fill="none"/>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <text x="10" y="42" fill="#00ffc3" font-family="ui-monospace, monospace" font-size="38" font-weight="600" letter-spacing="2" filter="url(#glow)">
      &gt;_402
    </text>
  </svg>
</div>


  <div className="header-actions">
    <a
      href="https://x.com/run402_fun"
      target="_blank"
      rel="noopener noreferrer"
      className="x-link"
      title="Follow us on X"
    >
      <svg width="20" height="20" viewBox="0 0 1200 1227" fill="#00ffc3" xmlns="http://www.w3.org/2000/svg">
        <path d="M714.163 519.284L1160.89 0H1058.44L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H102.443L514.601 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM568.931 687.828L520.031 618.918L139.418 79.6943H306.615L613.819 519.284L662.719 588.194L1058.47 1146.68H891.271L568.931 687.828Z"/>
      </svg>
    </a>

    <button className="connect-btn" onClick={connectPhantom}>
      {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : "Connect Phantom"}
    </button>

    <div className="status">
      SYSTEM: <b>ONLINE</b>{" "}
      <span className={heartbeat ? "dot on" : "dot"}>●</span>
    </div>
  </div>
</div>


      {/* Hero prompt */}
      <div className="container prompt">
        <div className="line">
          <span className="path">/402</span>
          <span className="gt">$</span>
          <span className="cmd"> Run402 "Turning Attention into Value"</span>
          <span className="caret">▉</span>
        </div>
        <div className="output">Run402 — attention-to-earn layer on Solana. Pay with actions. Earn instantly.</div>
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
        <Panel title="SUBMIT RATIO">
          <Field label="Twitter Handle" placeholder="@username" value={form.handle} onChange={(v) => setForm({ ...form, handle: v })} />
          <Field label="Tweet URL" placeholder="https://x.com/run402_fun" value={form.url} onChange={(v) => setForm({ ...form, url: v })} />
          <Field label="Solana Wallet Address" placeholder="Enter your SOL address" value={form.wallet} onChange={(v) => setForm({ ...form, wallet: v })} />
          <div className="row">
            <button className="btn" onClick={submitForm}>[ submit ]</button>
          </div>
          <ul className="req">
            <li>must mention CA or $RATIO in tweet</li>
            <li>verification runs every ~1 minute</li>
            <li>payment sent automatically via creator fees</li>
          </ul>
        </Panel>

        <Panel title="RECENT RATIOS">
          <table className="table">
            <thead>
              <tr><th>handle</th><th>status</th><th className="tr">reward</th></tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id}><td>{r.handle}</td><td className={r.status === "Paid" ? "ok" : ""}>{r.status}</td><td className="tr">+{r.sol.toFixed(4)} SOL</td></tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="TOP RAIDERS">
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
          <ul ref={pendingRef} className="pending">
            {pending.map((p) => (
              <li key={p.id}><span className="ok">●</span> {p.handle} — <span className="dim">{p.status}</span> <span className="barp"><i style={{ width: p.progress + "%" }} /></span> {p.progress}%</li>
            ))}
            {!pending.length && <li className="dim">no pending submissions</li>}
          </ul>
        </Panel>

        <Panel title="FEE CLAIMS">
          <ul className="claims">
            {claims.map((c) => (<li key={c.id}><b>{c.sol.toFixed(6)} SOL</b> <span className="dim">— {c.ts}</span></li>))}
          </ul>
        </Panel>

        <Panel title="SYSTEM LOG">
          <pre ref={logRef} className="log">{log.join("\n")}</pre>
        </Panel>
      </div>

      <div className="footer container">© {new Date().getFullYear()} 402 Network — terminal edition</div>
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
  :root{ --bg:#050a07; --fg:#ccffd9; --dim:#75a38a; --ok:#3cff8f; --err:#ff5c5c; --line:#1a2a22; --edge:#244a3a; --glow:#1aff80; }
  .term-root{ background: radial-gradient(1200px 600px at 50% -10%, #08130e 0%, transparent 60%), var(--bg); color: var(--fg); min-height:100vh; font: 14px/1.45 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
  .container{ max-width:1200px; margin:0 auto; padding:0 16px; }
  .bar{ position:sticky; top:0; z-index:50; background:linear-gradient(to bottom, rgba(0,0,0,.6), rgba(0,0,0,.25)); backdrop-filter: blur(6px); border-bottom: 1px solid var(--edge); display:flex; align-items:center; justify-content:space-between; padding:10px 16px; }
  .brand{ letter-spacing:.2em; color:#baf7d3; }
  .status b{ color: var(--ok); }
  .status .dot{ margin-left:8px; color:#3a8f6d; transition: color .25s ease }
  .status .dot.on{ color:#3cff8f; text-shadow: 0 0 8px rgba(60,255,143,.6) }

  .prompt{ padding:24px 0 8px; }
  .line{ display:flex; gap:8px; align-items:center; white-space:nowrap; overflow:auto; }
  .path{ color:#8ee0b4; }
  .gt{ color:#4dffae; }
  .cmd{ color:#c2ffe1; }
  .caret{ color:#8bffbf; margin-left:6px; animation: caretBlink 1.2s infinite }
  @keyframes caretBlink{ 0%,100%{opacity:1} 50%{opacity:.2} }
  .output{ margin-top:8px; color:#a6d8bf }

  .grid{ display:grid; gap:12px; }
  .kpi{ grid-template-columns: repeat(4, 1fr); padding: 12px 0 8px; }
  .main{ grid-template-columns: 1.1fr 1fr 0.9fr; padding: 8px 0; }
  .foot{ grid-template-columns: 1.1fr 0.9fr 1fr; padding: 8px 0 24px; align-items: stretch; }

  .box{ border:1px solid var(--edge); background: rgba(10,20,16,.35); box-shadow: inset 0 0 0 1px rgba(115,255,186,.06), 0 0 40px rgba(26,255,128,.06); padding:14px; border-radius:8px; }
  .box .title{ color: var(--dim); font-size:12px; letter-spacing:.08em }
  .box .val{ margin-top:6px; font-size:22px; color:#dfffea; text-shadow: 0 0 12px rgba(26,255,128,.18) }

  .panel{ border:1px solid var(--edge); background: rgba(8,18,14,.35); border-radius:8px; box-shadow: inset 0 0 0 1px rgba(115,255,186,.06), 0 0 40px rgba(26,255,128,.05); display:flex; flex-direction:column; height:100%; }
  .panel-title{ padding:10px 12px; border-bottom:1px solid var(--edge); color:#b6f7d0; letter-spacing:.12em }
  .panel-body{ padding:12px; flex:1; display:flex; flex-direction:column; }

  .field{ display:flex; flex-direction:column; gap:6px; margin-bottom:10px }
  .lab{ color: var(--dim) }
  input{ background: rgba(0,0,0,.35); border:1px solid var(--edge); border-radius:6px; color:var(--fg); padding:10px 12px; outline:none; box-shadow: inset 0 0 0 1px rgba(26,255,128,.06); }
  input:focus{ border-color:#39f2a6; box-shadow: 0 0 0 2px rgba(57,242,166,.25) }
  .row{ display:flex; align-items:center; gap:10px; }
  .btn{ background: rgba(0,0,0,.45); color:#d6ffe9; border:1px solid #3cff8f; padding:8px 14px; border-radius:6px; text-transform:lowercase; letter-spacing:.08em; cursor:pointer; }
  .btn:hover{ box-shadow: 0 0 18px rgba(60,255,143,.25); transform: translateY(-1px) }

  .req{ list-style:none; margin:10px 0 0; padding:0; color: var(--dim) }
  .req li{ margin:2px 0 }

  .table{ width:100%; border-collapse: separate; border-spacing:0; }
  .table thead th{ font-weight:600; color:#b2f0ce; border-bottom:1px solid var(--edge); padding:8px 6px; }
  .table td{ padding:8px 6px; border-bottom:1px dashed #1d3329; }
  .tr{ text-align:right }
  .ok{ color: var(--ok) }
  .dim{ color: var(--dim) }

.brand svg text {
  animation: blink 1.2s step-end infinite;
}

@keyframes blink {
  50% {
    fill: rgba(0, 255, 195, 0.4);
    text-shadow: none;
  }
}


  .pending {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  max-height: 420px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  scrollbar-width: thin;
  scrollbar-color: #1aff80 transparent;
}

.pending li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px dashed #1d3329;
  flex-shrink: 0; /* <<< ключевой момент */
}

  .pending li{ display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px dashed #1d3329; }
  .barp{ flex:1; height:8px; background:rgba(0,0,0,.4); border:1px solid var(--edge); border-radius:4px; margin:0 8px }
  .barp i{ display:block; height:100%; background: linear-gradient(90deg, #1aff80, #21c9ff); box-shadow: 0 0 14px rgba(26,255,128,.3) inset; border-radius:3px }

  .claims{ list-style:none; padding:0; margin:0; flex:1; max-height:420px; overflow-y:auto; scrollbar-width:thin; scrollbar-color:#1aff80 transparent; }
  .claims li{ padding:6px 0; border-bottom:1px dashed #1d3329; }

  .log{ color:#a3e6c5; white-space:pre-wrap; flex:1; max-height:420px; overflow-y:auto; scrollbar-width:thin; scrollbar-color:#1aff80 transparent; }

  .footer{ padding:12px 0 30px; color:#8fc7ad; border-top:1px solid var(--edge) }

  .fadein{ animation: fadeIn .5s ease both }
  @keyframes fadeIn{ from{ opacity:0; transform: translateY(4px) } to{ opacity:1; transform:none } }

  @media (max-width: 1080px){ .main{ grid-template-columns: 1fr; } .foot{ grid-template-columns: 1fr; } .kpi{ grid-template-columns: 1fr 1fr; } }
  @media (max-width: 640px){ .kpi{ grid-template-columns: 1fr; } }
  html, body {
  margin: 0;
  padding: 0;
  background: #050a07;
  color: #ccffd9;
  height: 100%;
}
body {
  overflow-x: hidden;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.connect-btn {
  background: transparent;
  color: #00ffc3;
  border: 1px solid #00ffc3;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.connect-btn:hover {
  background: #00ffc3;
  color: #000;
}

.x-link svg {
  transition: transform 0.2s ease;
}
.x-link:hover svg {
  transform: scale(1.15);
}

.top ul {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  max-height: none; /* убираем ограничение */
  overflow-y: visible; /* разрешаем показывать весь список */
}

.top li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px dashed #1d3329;
}

`;
