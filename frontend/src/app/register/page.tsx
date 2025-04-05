"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { authApi } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    return errors;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setFormData(prev => ({ ...prev, password: newPassword }));
    setPasswordErrors(validatePassword(newPassword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate password before submission
    const errors = validatePassword(formData.password);
    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }
    
    setLoading(true);

    try {
      const data = await authApi.register(formData);

      // Show OTP if it's included in the response (development only)
      if (data.otp) {
        toast({
          title: 'Development OTP',
          description: `Your OTP is: ${data.otp}`,
          duration: 10000,
        });
      }

      toast({
        title: 'Success',
        description: 'Registration successful! Please check your email for OTP.',
      });
      
      // Redirect to OTP verification page
      router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Display the specific error message from the backend
      if (error.message === 'Email already registered') {
        setError('This email is already registered. Please login instead.');
      } else if (error.message.includes('Password must')) {
        setError(error.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-[400px]">
          <CardHeader>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CardTitle>Create Account</CardTitle>
              <CardDescription>
                Enter your details to create a new account
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error}
                  {error.includes('already registered') && (
                    <div className="mt-2">
                      <Link href="/login" className="text-primary hover:underline">
                        Click here to login
                      </Link>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <Input
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <Input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  required
                  className={passwordErrors.length > 0 ? 'border-red-500' : ''}
                />
                {formData.password && (
                  <div className="text-sm space-y-1 mt-2">
                    {passwordErrors.length > 0 ? (
                      passwordErrors.map((error, index) => (
                        <p key={index} className="text-red-500">{error}</p>
                      ))
                    ) : (
                      <p className="text-green-500">Password meets all requirements</p>
                    )}
                  </div>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-2"
              >
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </motion.div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
} 