import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTransactions, createTransaction, exportCsv, importCsv } from '../../lib/transactions';
import { fetchAccounts } from '../../lib/accounts';
import { useToast } from '../../lib/toast';

export default function TransactionsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const take = 20;
  const skip = page * take;

  const [dateFrom, setDateFrom] = useState('');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['transactions', q, page, dateFrom],
    queryFn: () => fetchTransactions({ q, dateFrom: dateFrom || undefined, skip: page * take, take }),
  });
  const total = data?.total || 0;
  const items = data?.data || [];
  const pages = useMemo(() => Math.max(1, Math.ceil(total / take)), [total]);

  const { data: accounts } = useQuery({ queryKey: ['accounts'], queryFn: fetchAccounts });

  const createMut = useMutation({
    mutationFn: createTransaction,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['transactions'] });
      const prev = qc.getQueryData(['transactions', q, page, dateFrom]);
      if (prev?.data) {
        const optimistic = { ...vars, id: `temp-${Date.now()}`, createdAt: new Date().toISOString() };
        qc.setQueryData(['transactions', q, page, dateFrom], { ...prev, data: [optimistic, ...prev.data] });
      }
      return { prev };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['transactions', q, page, dateFrom], ctx.prev);
      toast.push({ type: 'error', message: 'Failed to add transaction' });
    },
    onSuccess: () => {
      toast.push({ type: 'success', message: 'Transaction added' });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['transactions'] })
  });

  const [form, setForm] = useState({ accountId: '', amount: '', currency: 'USD', date: '', merchant: '', notes: '' });
  useEffect(() => {
    if (accounts && accounts.length && !form.accountId) setForm((f) => ({ ...f, accountId: accounts[0].id }));
  }, [accounts]);

  const [errorMsg, setErrorMsg] = useState(null);

  const onCreate = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!form.accountId || !form.amount || !form.date) {
      setErrorMsg('Please choose an account, amount, and date.');
      return;
    }
    try {
      await createMut.mutateAsync({ ...form, amount: Number(form.amount), date: new Date(form.date).toISOString() });
      setForm((f) => ({ ...f, amount: '', merchant: '', notes: '' }));
    } catch (e) {
      setErrorMsg(e?.response?.data?.error || 'Failed to add transaction');
    }
  };

  const onExport = async () => {
    const blob = await exportCsv();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    toast.push({ type: 'success', message: 'Exported CSV' });
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await importCsv(file);
    qc.invalidateQueries({ queryKey: ['transactions'] });
    e.target.value = '';
  };

  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto max-w-5xl px-6">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <div className="text-sm text-gray-400">Search, add, import, or export</div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex gap-3 items-center">
            <input
              value={q}
              onChange={(e)=>{ setPage(0); setQ(e.target.value); }}
              placeholder="Search..."
              className="border rounded px-3 py-2 text-sm"
            />
            <input type="date" value={dateFrom} onChange={(e)=>{ setPage(0); setDateFrom(e.target.value); }} className="border rounded px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-3 ml-auto">
            <button onClick={onExport} className="btn btn-outline">Export CSV</button>
            <label className="btn btn-outline cursor-pointer">
              Import CSV
              <input onChange={onImport} type="file" accept=".csv" className="hidden" />
            </label>
          </div>
        </div>

        <section className="mt-6">
          {Array.isArray(accounts) && accounts.length === 0 && (
            <div className="card p-4 mb-4">
              <div className="text-sm">
                You have no accounts yet. Please create one first on <a className="underline" href="/accounts">Accounts</a> page, then return here to add transactions.
              </div>
            </div>
          )}
          <form onSubmit={onCreate} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs mb-1">Account</label>
              <select className="w-full border rounded px-3 py-2" value={form.accountId} onChange={(e)=>setForm({...form, accountId: e.target.value})}>
                <option value="">Select an account</option>
                {(accounts||[]).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1">Amount</label>
              <input className="w-full border rounded px-3 py-2" type="number" step="0.01" value={form.amount} onChange={(e)=>setForm({...form, amount: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs mb-1">Date</label>
              <input className="w-full border rounded px-3 py-2" type="date" value={form.date} onChange={(e)=>setForm({...form, date: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs mb-1">Merchant</label>
              <input className="w-full border rounded px-3 py-2" value={form.merchant} onChange={(e)=>setForm({...form, merchant: e.target.value})} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs mb-1">Notes</label>
              <input className="w-full border rounded px-3 py-2" value={form.notes} onChange={(e)=>setForm({...form, notes: e.target.value})} />
            </div>
            <div>
              <button disabled={createMut.isPending || !form.accountId || !form.amount || !form.date} className="btn btn-primary disabled:opacity-60">{createMut.isPending ? 'Adding...' : 'Add'}</button>
            </div>
          </form>
          {errorMsg && (<div className="mt-2 text-sm text-red-600">{errorMsg}</div>)}
        </section>

        <section className="mt-6">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-9 bg-neutral-800 animate-pulse rounded" />
              <div className="h-9 bg-neutral-800 animate-pulse rounded" />
              <div className="h-9 bg-neutral-800 animate-pulse rounded" />
            </div>
          ) : isError ? (
            <div className="text-sm text-red-600">Failed to load transactions</div>
          ) : (
            <div className="overflow-x-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-neutral-900">
                  <tr>
                    <th className="text-left p-2 border-b">Date</th>
                    <th className="text-left p-2 border-b">Merchant</th>
                    <th className="text-left p-2 border-b">Amount</th>
                    <th className="text-left p-2 border-b">Currency</th>
                    <th className="text-left p-2 border-b">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.data||[]).map((t)=> {
                    const dateStr = new Date(t.date).toLocaleDateString();
                    const highlight = (text) => {
                      if (!q || !text) return text || '';
                      const idx = String(text).toLowerCase().indexOf(q.toLowerCase());
                      if (idx === -1) return text;
                      return (
                        <>
                          {text.slice(0, idx)}
                          <mark className="bg-green-500/30 text-white px-0.5 rounded">
                            {text.slice(idx, idx + q.length)}
                          </mark>
                          {text.slice(idx + q.length)}
                        </>
                      );
                    };
                    const dateHighlighted = (dateFrom) ? (
                      <mark className="bg-green-500/20 text-white px-1 rounded">{dateStr}</mark>
                    ) : dateStr;
                    return (
                      <tr key={t.id} className="hover:bg-neutral-900/60">
                        <td className="p-2 border-b">{dateHighlighted}</td>
                        <td className="p-2 border-b">{highlight(t.merchant || '-')}</td>
                        <td className="p-2 border-b">{Number(t.amount).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                        <td className="p-2 border-b">{t.currency}</td>
                        <td className="p-2 border-b">{highlight(t.notes || '')}</td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={5}>No transactions</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 text-sm">
            <div>Page {page + 1} of {pages}</div>
            <div className="flex gap-2">
              <button disabled={page===0} onClick={()=>setPage((p)=>Math.max(0,p-1))} className="border rounded px-3 py-1 disabled:opacity-50">Prev</button>
              <button disabled={page+1>=pages} onClick={()=>setPage((p)=>p+1)} className="border rounded px-3 py-1 disabled:opacity-50">Next</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
