'use client';

import Link from 'next/link';
import { Shield, Sparkles, UserPlus } from 'lucide-react';
import { Container } from '@/components/layout';
import { Button, Input, Card } from '@/components/ui';
import { useState } from 'react';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);

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
          <form className="space-y-5">
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
            
            <Button 
              type="submit" 
              variant="kenya" 
              className="w-full"
              isLoading={isLoading}
              onClick={(e) => {
                e.preventDefault();
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 2000);
              }}
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
