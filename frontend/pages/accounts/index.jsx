import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { fetchAccounts, createAccount } from '../../lib/accounts';
import { useToast } from '../../lib/toast';

export default function AccountsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading, isError } = useQuery({ queryKey: ['accounts'], queryFn: fetchAccounts });
  const items = data || [];

  const [form, setForm] = useState({ name: '', type: 'checking', currency: 'USD', balance: '' });
  const createMut = useMutation({
    mutationFn: createAccount,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['accounts'] });
      const prev = qc.getQueryData(['accounts']);
      qc.setQueryData(['accounts'], [ ...(prev||[]), { ...vars, id: `temp-${Date.now()}` } ]);
      return { prev };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['accounts'], ctx.prev);
      toast.push({ type: 'error', message: 'Failed to create account' });
    },
    onSuccess: () => {
      toast.push({ type: 'success', message: 'Account created' });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['accounts'] })
  });

  const onCreate = async (e) => {
    e.preventDefault();
    await createMut.mutateAsync({ ...form, balance: Number(form.balance || 0) });
    setForm({ name: '', type: 'checking', currency: 'USD', balance: '' });
  };

  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto max-w-4xl px-6">
        <h1 className="text-2xl font-semibold">Accounts</h1>

        <section className="mt-6 card p-4">
          <form onSubmit={onCreate} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs mb-1">Name</label>
              <input className="w-full border rounded px-3 py-2" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <label className="block text-xs mb-1">Type</label>
              <select className="w-full border rounded px-3 py-2" value={form.type} onChange={(e)=>setForm({...form, type: e.target.value})}>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="cash">Cash</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1">Currency</label>
              <input className="w-full border rounded px-3 py-2" value={form.currency} onChange={(e)=>setForm({...form, currency: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs mb-1">Initial Balance</label>
              <input className="w-full border rounded px-3 py-2" type="number" step="0.01" value={form.balance} onChange={(e)=>setForm({...form, balance: e.target.value})} />
            </div>
            <div>
              <button className="btn btn-primary">Create</button>
            </div>
          </form>
        </section>

        <section className="mt-6">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-16 bg-neutral-800 animate-pulse rounded" />
              <div className="h-16 bg-neutral-800 animate-pulse rounded" />
            </div>
          ) : isError ? (
            <div className="text-sm text-red-600">Failed to load accounts</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {items.map((a) => (
                <div key={a.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-xs text-gray-600">{a.type} • {a.currency}</div>
                    </div>
                    <div className="text-right font-semibold">{Number(a.balance).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-sm text-gray-600">No accounts yet.</div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
