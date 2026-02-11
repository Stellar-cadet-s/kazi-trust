'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, UserPlus } from 'lucide-react';
import { Container } from '@/components/layout';
import { Button, Input, Card } from '@/components/ui';
import { authService } from '@/services/api';
import { setAuth } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'employer' | 'employee'>('employer');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'worker') setRole('employee');
    if (type === 'employer') setRole('employer');
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#006B3F]/10 via-[#00A8E8]/10 to-[#7B3FF2]/10" />
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#006B3F]/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#7B3FF2]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      
      <Container className="max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#006B3F] to-[#00A8E8] rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative bg-gradient-to-r from-[#006B3F] to-[#00A8E8] p-3 rounded-lg">
                <Shield className="text-white" size={32} />
              </div>
            </div>
            <div className="text-left">
              <span className="text-3xl font-bold bg-gradient-to-r from-[#7B3FF2] via-[#00A8E8] to-[#006B3F] bg-clip-text text-transparent">
                Kazi Trust
              </span>
              <p className="text-xs text-gray-500">Powered by Stellar</p>
            </div>
          </Link>
          
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-4 shadow-lg">
            <UserPlus className="text-[#006B3F]" size={16} />
            <span className="text-sm font-semibold bg-gradient-to-r from-[#006B3F] to-[#00A8E8] bg-clip-text text-transparent">
              Join Kazi Trust
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mt-6">Create account</h1>
          <p className="text-gray-600 mt-2">Start your journey with us</p>
        </div>

        <Card gradient hover>
          <form className="space-y-5" onSubmit={handleSubmit}>
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
            
            <Button 
              type="submit" 
              variant="kenya" 
              className="w-full"
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold bg-gradient-to-r from-[#006B3F] to-[#00A8E8] bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              Sign in
            </Link>
          </p>
        </Card>
      </Container>
    </div>
  );
}
