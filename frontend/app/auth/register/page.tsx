'use client';

import Link from 'next/link';
import { Container } from '@/components/layout';
import { Button, Input, Card } from '@/components/ui';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <Container className="max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600">
            TrustWork
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6">Create account</h1>
          <p className="text-gray-600 mt-2">Join TrustWork today</p>
        </div>

        <Card>
          <form className="space-y-4">
            <Input
              type="text"
              label="Full Name"
              placeholder="John Doe"
              required
            />
            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              required
            />
            <Input
              type="tel"
              label="Phone Number"
              placeholder="+254 700 000000"
              required
            />
            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              required
            />
            
            <Button type="submit" variant="primary" className="w-full">
              Create Account
            </Button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </Container>
    </div>
  );
}
