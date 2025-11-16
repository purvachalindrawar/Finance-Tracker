import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth';

export default function SignUp() {
  const router = useRouter();
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: 'Demo User', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const passwordTooShort = form.password && form.password.length < 6;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (passwordTooShort) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      router.push('/');
    } catch (e) {
      setError(e?.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6">Create account</h1>
        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input className="w-full border rounded px-3 py-2" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input className="w-full border rounded px-3 py-2" type="email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input className={`w-full border rounded px-3 py-2 ${passwordTooShort ? 'border-red-500' : ''}`} type="password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} required />
            {passwordTooShort && (
              <div className="text-xs text-red-500 mt-1">Password must be at least 6 characters</div>
            )}
          </div>
          <button disabled={loading || passwordTooShort} className="w-full bg-black text-white rounded py-2">
            {loading ? 'Creating...' : 'Sign up'}
          </button>
        </form>
        <p className="text-sm text-gray-600 mt-4">
          Already have an account? <a className="underline" href="/auth/signin">Sign in</a>
        </p>
      </div>
    </main>
  );
}
