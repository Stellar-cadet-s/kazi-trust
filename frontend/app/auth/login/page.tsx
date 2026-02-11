'use client';

import Link from 'next/link';
import { Container } from '@/components/layout';
import { Button, Input, Card } from '@/components/ui';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <Container className="max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600">
            TrustWork
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6">Welcome back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <Card>
          <form className="space-y-4">
            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              required
            />
            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              required
            />
            
            <Button type="submit" variant="primary" className="w-full">
              Sign In
            </Button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </Card>
      </Container>
    </div>
  );
}
