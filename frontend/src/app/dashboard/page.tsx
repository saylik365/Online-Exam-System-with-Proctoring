'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';

// Sample data for charts - replace with real data from API
const examData = [
  { name: 'Week 1', exams: 4 },
  { name: 'Week 2', exams: 3 },
  { name: 'Week 3', exams: 6 },
  { name: 'Week 4', exams: 2 },
];

const resultData = [
  { name: 'Passed', value: 75 },
  { name: 'Failed', value: 25 },
];

const COLORS = ['#0088FE', '#FF8042'];

export default function Dashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Success',
        description: 'Logged out successfully',
      });
      router.push('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive',
      });
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6"
    >
      <div className="flex justify-between items-center mb-8">
        <motion.h1
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold"
        >
          Welcome, {user.name}!
        </motion.h1>
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4"
        >
          <Button onClick={() => router.push('/profile')} variant="outline">
            Edit Profile
          </Button>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Profile Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Status:</strong> {user.isEmailVerified ? 'Verified' : 'Not Verified'}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Coding Challenges Card - Available for all users */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Coding Challenges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(user.role === 'faculty' || user.role === 'admin') && (
                <>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => router.push('/challenges/create')}
                  >
                    Create Challenge
                  </Button>
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={() => router.push('/challenges/manage')}
                  >
                    Manage Challenges
                  </Button>
                </>
              )}
              <Button 
                className="w-full"
                variant={user.role === 'student' ? 'default' : 'outline'}
                onClick={() => router.push('/challenges')}
              >
                {user.role === 'student' ? 'Practice Challenges' : 'View All Challenges'}
              </Button>
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => router.push('/challenges/submissions')}
              >
                View Submissions
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Faculty/Admin Features */}
        {(user.role === 'faculty' || user.role === 'admin') && (
          <>
            {/* Question Management */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Question Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => router.push('/questions/create')}
                  >
                    Create Question
                  </Button>
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={() => router.push('/questions')}
                  >
                    Manage Questions
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Exam Management */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Exam Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => router.push('/exams/create')}
                  >
                    Create New Exam
                  </Button>
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={() => router.push('/exams')}
                  >
                    View All Exams
                  </Button>
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={() => router.push('/results')}
                  >
                    View Results
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Analytics */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="md:col-span-2 lg:col-span-3"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Analytics Overview</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div className="h-[300px]">
                    <h3 className="text-lg font-semibold mb-4">Exam Statistics</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={examData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="exams" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-[300px]">
                    <h3 className="text-lg font-semibold mb-4">Pass/Fail Rate</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={resultData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {resultData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {/* Student Features */}
        {user.role === 'student' && (
          <>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Exam Center</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => router.push('/exams')}
                  >
                    Available Exams
                  </Button>
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={() => router.push('/results')}
                  >
                    My Results
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Student Analytics */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="md:col-span-2 lg:col-span-3"
            >
              <Card>
                <CardHeader>
                  <CardTitle>My Performance</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={examData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="exams" fill="#8884d8" name="Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
} 