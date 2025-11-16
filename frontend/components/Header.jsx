import Link from 'next/link';
import { useAuth } from '../lib/auth';
import { useRouter } from 'next/router';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const isActive = (href) => router.pathname.startsWith(href);
  return (
    <header className="border-b border-neutral-800 bg-[#121212]/90 backdrop-blur">
      <div className="container mx-auto max-w-5xl px-6 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold brand">Finance Tracker</Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/transactions" className={`link-muted ${isActive('/transactions') ? 'nav-active' : ''}`}>Transactions</Link>
          <Link href="/accounts" className={`link-muted ${isActive('/accounts') ? 'nav-active' : ''}`}>Accounts</Link>
          <Link href="/budgets" className={`link-muted ${isActive('/budgets') ? 'nav-active' : ''}`}>Budgets</Link>
          <Link href="/settings" className={`link-muted ${isActive('/settings') ? 'nav-active' : ''}`}>Settings</Link>
          <Link href="/chat" className={`link-muted ${isActive('/chat') ? 'nav-active' : ''}`}>Chat</Link>
          {user ? (
            <>
              <span className="text-xs sm:text-sm text-gray-300 hidden sm:inline">{user.email}</span>
              <button onClick={logout} className="btn btn-outline">Logout</button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="btn btn-outline">Sign in</Link>
              <Link href="/auth/signup" className="btn btn-primary">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
