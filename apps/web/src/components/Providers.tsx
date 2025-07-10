'use client';

import { SessionProvider } from 'next-auth/react';
import { PropsWithChildren } from 'react';
import ThemeProvider from './ThemeProvider';
import { SignupFlowProvider } from '@lib/contexts/SignupFlowContext';

export default function Providers({ children }: PropsWithChildren) {
  return (
    <SessionProvider>
      <SignupFlowProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </SignupFlowProvider>
    </SessionProvider>
  );
}
