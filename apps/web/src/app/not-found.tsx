'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@components/ui/button';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(() => {
      router.push('/');
    }, 3000);
    return () => clearTimeout(id);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">404 - Page Not Found</h2>
        <p className="text-muted-foreground">Redirecting to the home page...</p>
        <Button asChild>
          <Link href="/">Go Home Now</Link>
        </Button>
      </div>
    </div>
  );
}
