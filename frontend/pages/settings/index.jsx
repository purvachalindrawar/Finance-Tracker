import { useMutation, useQuery } from '@tanstack/react-query';
import { getSettings, updateSettings } from '../../lib/settings';
import { useState, useEffect } from 'react';

const currencies = ['USD','EUR','INR','GBP','JPY'];
const locales = ['en-US','en-GB','hi-IN'];

export default function SettingsPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const [form, setForm] = useState({ currency: 'USD', locale: 'en-US', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  useEffect(()=>{ if (data) setForm({ currency: data.currency || 'USD', locale: data.locale || 'en-US', timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone }); }, [data]);

  const mut = useMutation({ mutationFn: updateSettings });

  const onSave = async (e) => {
    e.preventDefault();
    await mut.mutateAsync(form);
  };

  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto max-w-3xl px-6">
        <h1 className="text-2xl font-semibold">Settings</h1>

        <section className="mt-6 card p-4">
          {isLoading ? (
            <div className="text-sm text-gray-400">Loading...</div>
          ) : isError ? (
            <div className="text-sm text-red-500">Failed to load settings</div>
          ) : (
            <form onSubmit={onSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1">Currency</label>
                <select className="w-full px-3 py-2" value={form.currency} onChange={(e)=>setForm({...form, currency: e.target.value})}>
                  {currencies.map(c=> <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1">Locale</label>
                <select className="w-full px-3 py-2" value={form.locale} onChange={(e)=>setForm({...form, locale: e.target.value})}>
                  {locales.map(l=> <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs mb-1">Timezone</label>
                <input className="w-full px-3 py-2" value={form.timezone} onChange={(e)=>setForm({...form, timezone: e.target.value})} />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button className="btn btn-primary" disabled={mut.isPending}>{mut.isPending ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
