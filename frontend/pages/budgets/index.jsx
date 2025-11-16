import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { fetchBudgets, createBudget } from '../../lib/budgets';
import { fetchCategories, createCategory } from '../../lib/categories';
import { useToast } from '../../lib/toast';

export default function BudgetsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: budgets, isLoading, isError } = useQuery({ queryKey: ['budgets'], queryFn: fetchBudgets });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const [form, setForm] = useState({ categoryId: '', periodType: 'monthly', limitAmount: '' });
  const [catName, setCatName] = useState('');
  useEffect(() => {
    if (categories && categories.length && !form.categoryId) setForm((f)=>({ ...f, categoryId: categories[0].id }));
  }, [categories]);

  const createMut = useMutation({
    mutationFn: createBudget,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['budgets'] });
      const prev = qc.getQueryData(['budgets']);
      qc.setQueryData(['budgets'], [ ...(prev||[]), { ...vars, id: `temp-${Date.now()}`, category: (categories||[]).find(c=>c.id===vars.categoryId) } ]);
      return { prev };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['budgets'], ctx.prev);
      toast.push({ type: 'error', message: 'Failed to create budget' });
    },
    onSuccess: () => {
      toast.push({ type: 'success', message: 'Budget created' });
    },
    onSettled: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); qc.invalidateQueries({ queryKey: ['budgets','summary'] }); }
  });
  const createCatMut = useMutation({ mutationFn: (name) => createCategory({ name }), onSuccess: async (cat) => {
    await qc.invalidateQueries({ queryKey: ['categories'] });
    setForm((f)=>({ ...f, categoryId: cat.id }));
    setCatName('');
  }});
  const [errorMsg, setErrorMsg] = useState(null);

  const onCreate = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!form.categoryId || !form.limitAmount) { setErrorMsg('Choose a category and limit'); return; }
    try {
      await createMut.mutateAsync({ ...form, limitAmount: Number(form.limitAmount) });
      setForm((f)=>({ ...f, limitAmount: '' }));
    } catch (e) {
      setErrorMsg(e?.response?.data?.error || 'Failed to create budget');
    }
  };

  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto max-w-5xl px-6">
        <h1 className="text-2xl font-semibold">Budgets</h1>

        <section className="mt-6 card p-4">
          <form onSubmit={onCreate} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs mb-1">Category</label>
              <select className="w-full border rounded px-3 py-2" value={form.categoryId} onChange={(e)=>setForm({...form, categoryId: e.target.value})}>
                <option value="">Select a category</option>
                {(categories||[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="mt-2 flex gap-2">
                <input className="flex-1 border rounded px-3 py-2" placeholder="Add new category" value={catName} onChange={(e)=>setCatName(e.target.value)} />
                <button type="button" disabled={createCatMut.isPending || !catName} onClick={()=>createCatMut.mutate(catName)} className="btn btn-outline">{createCatMut.isPending ? 'Adding...' : 'Add'}</button>
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1">Period</label>
              <select className="w-full border rounded px-3 py-2" value={form.periodType} onChange={(e)=>setForm({...form, periodType: e.target.value})}>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1">Limit</label>
              <input className="w-full border rounded px-3 py-2" type="number" step="0.01" value={form.limitAmount} onChange={(e)=>setForm({...form, limitAmount: e.target.value})} />
            </div>
            <div>
              <button disabled={createMut.isPending || !form.categoryId || !form.limitAmount} className="btn btn-primary">{createMut.isPending ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
          {errorMsg && (<div className="mt-2 text-sm text-red-600">{errorMsg}</div>)}
        </section>

        <section className="mt-6">
          <div className="card p-4">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-12 bg-neutral-800 animate-pulse rounded" />
                <div className="h-12 bg-neutral-800 animate-pulse rounded" />
                <div className="h-12 bg-neutral-800 animate-pulse rounded" />
              </div>
            ) : isError ? (
              <div className="text-sm text-red-600">Failed to load budgets</div>
            ) : (
              <div className="divide-y">
                {(budgets||[]).map((b)=> (
                  <div key={b.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{b.category?.name || 'Category'}</div>
                      <div className="text-xs text-gray-600">{b.periodType}</div>
                    </div>
                    <div className="font-semibold">{Number(b.limitAmount).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                  </div>
                ))}
                {(!budgets || budgets.length===0) && (
                  <div className="text-sm text-gray-600 py-3">No budgets yet.</div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
