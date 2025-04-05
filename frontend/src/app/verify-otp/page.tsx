'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { authApi } from '@/lib/api';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const email = searchParams.get('email');

  useEffect(() => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'No email provided. Please register first.',
        variant: 'destructive',
      });
      router.push('/register');
    }
  }, [email, router, toast]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && resendDisabled) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setResendDisabled(false);
    }
    return () => clearInterval(timer);
  }, [countdown, resendDisabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authApi.verifyOTP({ email, otp });

      // Store tokens and user data
      localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(data.user));

      toast({
        title: 'Success',
        description: 'Email verified successfully!',
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await authApi.resendOTP({ email });

      toast({
        title: 'Success',
        description: 'OTP sent successfully!',
      });
      setResendDisabled(true);
      setCountdown(60);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            Enter the OTP sent to {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                pattern="[0-9]{6}"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={handleResendOTP}
                disabled={resendDisabled}
              >
                {resendDisabled
                  ? `Resend OTP in ${countdown}s`
                  : 'Resend OTP'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 