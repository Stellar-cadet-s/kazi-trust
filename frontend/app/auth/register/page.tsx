'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/layout';
import { Button, Input, Card } from '@/components/ui';
import { authService } from '@/services/api';
import { setAuth } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const searchParams = useSearchParams();
  const [role, setRole] = useState<'employer' | 'employee'>('employer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'worker') setRole('employee');
    if (type === 'employer') setRole('employer');
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const phoneNumber = phone.replace(/\s/g, '').replace(/^0/, '254');
      const res = await authService.register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
        phone_number: phoneNumber,
        password,
        user_type: role,
      });
      setAuth(res.access, res.user);
      if (res.user.user_type === 'employer') {
        router.push('/employer/dashboard');
      } else {
        router.push('/worker/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

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
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                label="First name"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                type="text"
                label="Last name"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <Input
              type="email"
              label="Email (optional)"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="tel"
              label="Phone number"
              placeholder="254 700 000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'employer'}
                    onChange={() => setRole('employer')}
                    className="rounded border-gray-300"
                  />
                  <span>Employer</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'employee'}
                    onChange={() => setRole('employee')}
                    className="rounded border-gray-300"
                  />
                  <span>Worker</span>
                </label>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
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
