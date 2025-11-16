import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../styles/globals.css';
import { useState } from 'react';
import { AuthProvider } from '../lib/auth';
import Header from '../components/Header';
import { ToastProvider } from '../lib/toast';
import InsightsWidget from '../components/InsightsWidget';

export default function MyApp({ Component, pageProps }) {
  const [client] = useState(() => new QueryClient());
  return (
    <AuthProvider>
      <QueryClientProvider client={client}>
        <ToastProvider>
          <Header />
          <InsightsWidget />
          <Component {...pageProps} />
        </ToastProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
