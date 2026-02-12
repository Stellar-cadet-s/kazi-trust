'use client';

import { useCallback, useEffect, useState } from 'react';

// Paystack Inline V1: setup() returns handler with openIframe()
// V2 script may expose Paystack (not PaystackPop) as constructor – we support both
declare global {
  interface Window {
    PaystackPop?: {
      setup: (opts: {
        key: string;
        email: string;
        amount: number;
        ref: string;
        currency?: string;
        onClose?: () => void;
        callback?: (response: { reference: string }) => void;
      }) => { openIframe: () => void };
    };
    Paystack?: new () => {
      newTransaction: (opts: {
        key: string;
        email: string;
        amount: number;
        reference?: string;
        currency?: string;
        onSuccess?: (transaction: { reference: string }) => void;
        onCancel?: () => void;
        onError?: (error: { message: string }) => void;
      }) => void;
    };
  }
}

interface PaystackButtonProps {
  jobId: number;
  onSuccess?: () => void;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const PAYSTACK_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

export function PaystackButton({ jobId, onSuccess, onClose, className = '', children }: PaystackButtonProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load V1 script (reliable openIframe). Avoid V2 for now due to "not a constructor" in some envs.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.PaystackPop?.setup || window.Paystack) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, []);

  const handleClick = useCallback(async () => {
    if (!PAYSTACK_KEY) {
      alert('Paystack public key not configured. Set NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.');
      return;
    }
    setLoading(true);
    try {
      const { getToken } = await import('@/lib/auth');
      const token = getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/jobs/${jobId}/initiate-paystack/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate payment');

      // V1: PaystackPop.setup() + openIframe()
      if (typeof window.PaystackPop?.setup === 'function') {
        const handler = window.PaystackPop!.setup({
          key: PAYSTACK_KEY,
          email: data.email,
          amount: data.amount_kobo,
          ref: data.reference,
          currency: data.currency || 'KES',
          onClose: () => {
            setLoading(false);
            onClose?.();
          },
          callback: () => {
            setLoading(false);
            onSuccess?.();
          },
        });
        if (typeof handler?.openIframe === 'function') {
          handler.openIframe();
        } else {
          throw new Error('Paystack popup could not open. Try refreshing the page.');
        }
        return;
      }

      // V2: new Paystack().newTransaction() when available
      if (typeof window.Paystack === 'function') {
        const paystack = new window.Paystack();
        paystack.newTransaction({
          key: PAYSTACK_KEY,
          email: data.email,
          amount: data.amount_kobo,
          reference: data.reference,
          currency: data.currency || 'KES',
          onSuccess: () => {
            setLoading(false);
            onSuccess?.();
          },
          onCancel: () => {
            setLoading(false);
            onClose?.();
          },
          onError: (err: { message?: string }) => {
            setLoading(false);
            alert(err?.message || 'Payment failed');
          },
        });
        return;
      }

      alert('Paystack is loading. Try again in a moment.');
    } catch (e) {
      setLoading(false);
      alert(e instanceof Error ? e.message : 'Failed to start payment');
    }
  }, [jobId, onSuccess, onClose]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!scriptLoaded || loading}
      className={className}
    >
      {children ?? (loading ? 'Opening Paystack...' : 'Deposit with Paystack')}
    </button>
  );
}
