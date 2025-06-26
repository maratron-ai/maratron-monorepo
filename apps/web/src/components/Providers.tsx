'use client';

import { SessionProvider } from 'next-auth/react';
import { PropsWithChildren } from 'react';
import ThemeProvider from './ThemeProvider';

export default function Providers({ children }: PropsWithChildren) {
  return (
    <SessionProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
