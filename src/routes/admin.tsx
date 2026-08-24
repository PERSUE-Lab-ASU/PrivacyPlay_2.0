import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { fetchAdminData } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({ component: Admin });

function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ events: any[]; sessions: any[] } | null>(null);
  const fetchData = useServerFn(fetchAdminData);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetchData({ data: { password: pw } });
      setData(res);
      setAuthed(true);
    } catch (err: any) {
      setError("Incorrect password");
    }
  }

  if (!authed || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <form onSubmit={handleLogin} className="rounded-lg border border-rule bg-paper p-6 w-80 space-y-3">
          <h1 className="font-serif text-xl text-primary">Admin</h1>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="password" className="w-full border border-rule rounded px-3 py-2 text-sm" />
          <button className="w-full bg-primary text-primary-foreground rounded px-3 py-2 text-sm">Enter</button>
          {error && <p className="text-xs text-danger">{error}</p>}
          <p className="text-[10px] text-muted-foreground">Set ADMIN_PASSWORD secret to override the default.</p>
        </form>
      </div>
    );
  }
  return <Dashboard events={data.events} sessions={data.sessions} />;
}

function Dashboard({ events, sessions }: { events: any[]; sessions: any[] }) {
  const stageCounts = ["motivation", "tutorial", "play", "test"].map((s) => ({
    stage: s, sessions: new Set(events.filter((e) => e.stage === s).map((e) => e.session_id)).size,
  }));

  const epsBuckets: Record<string, number> = {};
  events.filter((e) => e.event_type === "epsilon_change" || e.event_type === "query_run").forEach((e) => {
    const eps = e.event_data?.new ?? e.event_data?.eps;
    if (typeof eps === "number") {
      const k = eps < 0.5 ? "0.1-0.5" : eps < 1 ? "0.5-1" : eps < 2 ? "1-2" : eps < 3 ? "2-3" : "3+";
      epsBuckets[k] = (epsBuckets[k] ?? 0) + 1;
    }
  });
  const epsData = Object.entries(epsBuckets).map(([range, count]) => ({ range, count }));

  const attackReplays = events.filter((e) => e.event_type === "replayed_attack").length;
  const attackRerun = events.filter((e) => e.event_type === "attack_rerun_count").length;

  const task2 = events.filter((e) => e.event_type === "task2_budget_allocation").map((e) => ({
    epsSum: e.event_data?.epsSum, epsCount: e.event_data?.epsCount,
  })).filter((d) => d.epsSum != null);

  const task3 = events.filter((e) => e.event_type === "task3_attempted_epsilon");
  const cheated = task3.filter((e) => (e.event_data?.eps ?? 0) >= 3).length;

  const concepts: Record<string, { right: number; total: number }> = {};
  events.filter((e) => e.event_type === "answer").forEach((e) => {
    const c = e.event_data?.concept; if (!c) return;
    concepts[c] = { right: (concepts[c]?.right ?? 0) + (e.event_data.correct ? 1 : 0), total: (concepts[c]?.total ?? 0) + 1 };
  });
  const conceptData = Object.entries(concepts).map(([concept, v]) => ({ concept, pct: Math.round((v.right / Math.max(v.total, 1)) * 100) }));

  return (
    <div className="min-h-screen bg-background p-8 max-w-7xl mx-auto">
      <h1 className="font-serif text-3xl text-primary">Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-6">{sessions.length} sessions · {events.length} events</p>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Funnel through stages">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stageCounts}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule)" />
              <XAxis dataKey="stage" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip />
              <Bar dataKey="sessions" fill="var(--color-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Epsilon choices">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={epsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule)" />
              <XAxis dataKey="range" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-danger)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Test scores by concept (%)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={conceptData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule)" />
              <XAxis type="number" domain={[0, 100]} stroke="var(--color-muted-foreground)" />
              <YAxis type="category" dataKey="concept" width={140} stroke="var(--color-muted-foreground)" />
              <Tooltip />
              <Bar dataKey="pct" fill="var(--color-primary)">
                {conceptData.map((d, i) => <Cell key={i} fill={d.pct >= 70 ? "var(--color-primary)" : "var(--color-danger)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Behavior signals">
          <ul className="text-sm space-y-2">
            <li><span className="font-mono text-xs text-muted-foreground">Attack replays (scroll-back) </span><span className="font-serif text-2xl text-primary">{attackReplays}</span></li>
            <li><span className="font-mono text-xs text-muted-foreground">Attack reruns (Tutorial 2.8) </span><span className="font-serif text-2xl text-primary">{attackRerun}</span></li>
            <li><span className="font-mono text-xs text-muted-foreground">Task 3 high-ε cheats </span><span className="font-serif text-2xl text-danger">{cheated}</span> / {task3.length}</li>
            <li><span className="font-mono text-xs text-muted-foreground">Task 2 submissions </span><span className="font-serif text-2xl text-primary">{task2.length}</span></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-rule bg-paper p-5">
      <h2 className="font-serif text-lg text-primary mb-3">{title}</h2>
      {children}
    </div>
  );
}
