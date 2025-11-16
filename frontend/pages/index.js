import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchForecast, fetchAnomalies, fetchRecommendations, generateRecommendations } from '../lib/analytics';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';

export default function Home() {
  const { token } = useAuth() || {};
  const enabled = !!token;
  const qc = useQueryClient();
  const toast = useToast();
  const { data: forecast } = useQuery({ queryKey: ['analytics','forecast'], queryFn: fetchForecast, enabled });
  const { data: anomalies } = useQuery({ queryKey: ['analytics','anomalies'], queryFn: fetchAnomalies, enabled });
  const { data: recs } = useQuery({ queryKey: ['analytics','recs'], queryFn: fetchRecommendations, enabled });
  const genMut = useMutation({
    mutationFn: generateRecommendations,
    onSuccess: async () => {
      toast.push({ type: 'success', message: 'Tips generated' });
      await qc.invalidateQueries({ queryKey: ['analytics','recs'] });
    },
    onError: () => toast.push({ type: 'error', message: 'Failed to generate tips' }),
  });
  const recText = (r) => {
    let p = r?.payloadJson;
    if (typeof p === 'string') { try { p = JSON.parse(p); } catch {} }
    if (r?.type === 'percent-of-income') {
      const rate = Number(p?.saveRate || 0);
      const income = Number(p?.income || 0);
      const target = income * rate;
      const keep = income - target;
      return `Aim to save ${(rate*100).toFixed(0)}% of your income (~${target.toLocaleString(undefined,{maximumFractionDigits:0})}). Try to keep monthly spend under ${keep.toLocaleString(undefined,{maximumFractionDigits:0})}.`;
    }
    return typeof p === 'object' ? `${r.type}` : `${r.type}`;
  };
  return (
    <main className="min-h-screen py-10">
      <div className="container mx-auto max-w-5xl px-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Finance Tracker</h1>
        </header>

        <nav className="mt-6 border-b border-neutral-800 pb-4">
          <ul className="flex flex-wrap gap-6 text-sm">
            <li>
              <Link className="link-muted" href="/transactions">Transactions</Link>
            </li>
            <li>
              <Link className="link-muted" href="/accounts">Accounts</Link>
            </li>
            <li>
              <Link className="link-muted" href="/budgets">Budgets</Link>
            </li>
            <li>
              <Link className="link-muted" href="/settings">Settings</Link>
            </li>
            <li>
              <Link className="link-muted" href="/chat">Chat</Link>
            </li>
          </ul>
        </nav>

        {!enabled && (
          <div className="mt-8 card p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl font-semibold">Welcome</div>
                <p className="mt-2 text-sm text-gray-300">Sign in to view your personalized forecast, anomaly alerts, and smart recommendations.</p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-600/30">Dashboard</span>
            </div>
            <div className="mt-4 flex gap-3">
              <Link className="btn btn-primary" href="/auth/signin">Sign in</Link>
              <Link className="btn btn-outline" href="/auth/signup">Create account</Link>
            </div>
          </div>
        )}

        <section className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Forecast</div>
              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-600/30">Beta</span>
            </div>
            {!forecast && enabled ? (
              <div className="space-y-2">
                <div className="h-28 bg-neutral-800 animate-pulse rounded" />
              </div>
            ) : enabled ? (
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer>
                  <LineChart data={(forecast?.forecast || []).map((p, i)=> ({ x: p.x ?? i, y: Number(p.y ?? 0) }))}>
                    <XAxis dataKey="x" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', color: '#E5E7EB' }} />
                    <Line type="monotone" dataKey="y" stroke="#1DB954" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-sm text-gray-400">Sign in to view your forecast.</div>
            )}
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Anomalies</div>
              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-600/30">Live</span>
            </div>
            {!anomalies && enabled ? (
              <div className="space-y-2">
                <div className="h-6 bg-neutral-800 animate-pulse rounded" />
                <div className="h-6 bg-neutral-800 animate-pulse rounded" />
              </div>
            ) : enabled ? (
              <ul className="text-sm list-disc pl-5 space-y-1">
                {(anomalies?.anomalies || []).slice(0,5).map((a, idx)=> (
                  <li key={idx}>{a.message || JSON.stringify(a)}</li>
                ))}
                {(!anomalies?.anomalies || anomalies.anomalies.length===0) && (
                  <li className="list-none text-gray-400">No anomalies detected</li>
                )}
              </ul>
            ) : (
              <div className="text-sm text-gray-400">Sign in to see anomaly alerts.</div>
            )}
          </div>
        </section>

        <section className="mt-6">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Recommendations</div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-600/30">AI</span>
                {enabled && (
                  <button
                    className="btn btn-outline px-2 py-1 text-xs"
                    onClick={()=>genMut.mutate()}
                    disabled={genMut.isPending}
                  >{genMut.isPending ? 'Generating…' : 'Generate tips'}</button>
                )}
              </div>
            </div>
            {!recs && enabled ? (
              <div className="space-y-2">
                <div className="h-6 bg-neutral-800 animate-pulse rounded" />
                <div className="h-6 bg-neutral-800 animate-pulse rounded" />
                <div className="h-6 bg-neutral-800 animate-pulse rounded" />
              </div>
            ) : enabled ? (
              <ul className="text-sm list-disc pl-5 space-y-1">
                {(recs || []).slice(0,3).map((r)=> (
                  <li key={r.id}>{recText(r)}</li>
                ))}
                {(!recs || recs.length===0) && (
                  <li className="list-none text-gray-400">No recommendations yet</li>
                )}
              </ul>
            ) : (
              <div className="text-sm text-gray-400">Sign in to get personalized tips.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
