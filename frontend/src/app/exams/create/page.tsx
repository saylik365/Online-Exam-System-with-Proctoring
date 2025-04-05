'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { examApi } from '@/lib/api';
import BackToDashboard from '@/components/BackToDashboard';
import { useAuth } from '@/contexts/AuthContext';

interface ExamForm {
  title: string;
  subject: string;
  duration: number;
  totalMarks: number;
  passingPercentage: number;
  description: string;
  instructions: string;
  startTime: string;
  endTime: string;
  questionCriteria: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export default function CreateExam() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ExamForm>({
    title: '',
    subject: '',
    duration: 60,
    totalMarks: 100,
    passingPercentage: 40,
    description: '',
    instructions: '',
    startTime: '',
    endTime: '',
    questionCriteria: {
      easy: 5,
      medium: 3,
      hard: 2
    }
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to continue',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    if (!authLoading && user?.role !== 'faculty') {
      toast({
        title: 'Access Denied',
        description: 'Only faculty members can create exams',
        variant: 'destructive',
      });
      router.push('/dashboard');
      return;
    }
  }, [user, authLoading, router, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an exam title',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.subject.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a subject',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.startTime || !formData.endTime) {
      toast({
        title: 'Error',
        description: 'Please select both start and end times',
        variant: 'destructive',
      });
      return false;
    }

    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);

    if (startTime >= endTime) {
      toast({
        title: 'Error',
        description: 'End time must be after start time',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.description.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a description',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          subject: formData.subject,
          duration: parseInt(formData.duration.toString()),
          totalMarks: parseInt(formData.totalMarks.toString()),
          passingPercentage: parseInt(formData.passingPercentage.toString()),
          description: formData.description,
          startTime: new Date(formData.startTime).toISOString(),
          endTime: new Date(formData.endTime).toISOString(),
          questionCriteria: formData.questionCriteria,
          questions: [] // Initially empty, questions will be added later
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create exam');
      }

      const exam = await response.json();
      
      toast({
        title: 'Success',
        description: 'Exam created successfully',
      });

      router.push('/exams');
    } catch (error: any) {
      console.error('Error creating exam:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create exam',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <BackToDashboard />
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Exam</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalMarks">Total Marks</Label>
                  <Input
                    id="totalMarks"
                    name="totalMarks"
                    type="number"
                    min="1"
                    value={formData.totalMarks}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passingPercentage">Passing Percentage</Label>
                  <Input
                    id="passingPercentage"
                    name="passingPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.passingPercentage}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Question Distribution</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="easyQuestions">Easy Questions</Label>
                    <Input
                      id="easyQuestions"
                      type="number"
                      min="0"
                      value={formData.questionCriteria.easy}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        questionCriteria: {
                          ...prev.questionCriteria,
                          easy: parseInt(e.target.value)
                        }
                      }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mediumQuestions">Medium Questions</Label>
                    <Input
                      id="mediumQuestions"
                      type="number"
                      min="0"
                      value={formData.questionCriteria.medium}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        questionCriteria: {
                          ...prev.questionCriteria,
                          medium: parseInt(e.target.value)
                        }
                      }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hardQuestions">Hard Questions</Label>
                    <Input
                      id="hardQuestions"
                      type="number"
                      min="0"
                      value={formData.questionCriteria.hard}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        questionCriteria: {
                          ...prev.questionCriteria,
                          hard: parseInt(e.target.value)
                        }
                      }))}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push('/exams')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Exam'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 