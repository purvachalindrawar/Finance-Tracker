import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { fetchForecast, fetchAnomalies, fetchRecommendations } from '../lib/analytics';
import { useAuth } from '../lib/auth';

export default function InsightsWidget() {
  const router = useRouter();
  const hide = router.pathname.startsWith('/auth');
  const { token } = useAuth() || {};
  const enabled = !!token && !hide;

  const { data: forecast } = useQuery({ queryKey: ['widget','forecast'], queryFn: fetchForecast, enabled });
  const { data: anomalies } = useQuery({ queryKey: ['widget','anomalies'], queryFn: fetchAnomalies, enabled });
  const { data: recs } = useQuery({ queryKey: ['widget','recs'], queryFn: fetchRecommendations, enabled });

  if (!enabled) return null;

  const anomalyCount = (anomalies?.anomalies || []).length;
  const recCount = (recs || []).length;
  const hasForecast = (forecast?.forecast || []).length > 0;

  return (
    <div className="sticky top-0 z-30 bg-gradient-to-b from-black/20 to-transparent">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mt-2 mb-4 rounded-lg border border-neutral-800 bg-neutral-900/60 backdrop-blur px-3 py-2 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 transition-transform duration-300">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <Badge label="Forecast" status={hasForecast ? 'ready' : 'loading'} />
            <Badge label="Anomalies" value={anomalyCount} intent={anomalyCount > 0 ? 'warn' : 'ok'} />
            <Badge label="Tips" value={recCount} intent={recCount > 0 ? 'info' : 'muted'} />
          </div>
          <div className="flex items-center gap-2">
            <Link className="btn btn-outline text-xs sm:text-sm" href="/">Open dashboard</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ label, value, status, intent }) {
  const colors = intent === 'warn'
    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    : intent === 'ok'
    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    : intent === 'info'
    ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
    : 'bg-neutral-800 text-gray-300 border-neutral-700';
  const pulse = status === 'loading' ? 'animate-pulse' : '';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border ${colors} ${pulse}`}>
      <span className="font-medium">{label}</span>
      {value !== undefined && (<span className="opacity-80">{value}</span>)}
    </span>
  );
}
