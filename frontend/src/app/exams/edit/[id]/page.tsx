'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

interface ExamData {
  title: string;
  description: string;
  subject: string;
  duration: string;
  startTime: string;
  endTime: string;
  questionCriteria: {
    easy: number;
    medium: number;
    hard: number;
  };
  isPublished: boolean;
}

export default function EditExam({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ExamData>({
    title: '',
    description: '',
    subject: '',
    duration: '',
    startTime: '',
    endTime: '',
    questionCriteria: {
      easy: 0,
      medium: 0,
      hard: 0
    },
    isPublished: false
  });

  useEffect(() => {
    fetchExamData();
  }, [params.id]);

  const fetchExamData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/exams/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch exam data');
      }

      const data = await response.json();
      
      // Format dates for datetime-local input
      const formatDate = (date: string) => {
        return new Date(date).toISOString().slice(0, 16);
      };

      setFormData({
        ...data,
        startTime: formatDate(data.startTime),
        endTime: formatDate(data.endTime),
        duration: data.duration.toString()
      });

      // Redirect if exam is published
      if (data.isPublished) {
        toast({
          title: 'Error',
          description: 'Published exams cannot be edited',
          variant: 'destructive',
        });
        router.push('/exams');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch exam data',
        variant: 'destructive',
      });
      router.push('/exams');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/exams/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          duration: parseInt(formData.duration),
          questionCriteria: {
            easy: parseInt(formData.questionCriteria.easy.toString()),
            medium: parseInt(formData.questionCriteria.medium.toString()),
            hard: parseInt(formData.questionCriteria.hard.toString())
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update exam');
      }

      toast({
        title: 'Success',
        description: 'Exam updated successfully',
      });

      router.push('/exams');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update exam',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('questionCriteria.')) {
      const difficulty = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        questionCriteria: {
          ...prev.questionCriteria,
          [difficulty]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Exam</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleChange}
                required
                min="1"
              />
            </div>

            <div>
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

            <div>
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

            <div className="space-y-4">
              <h3 className="font-semibold">Question Criteria</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="easy">Easy Questions</Label>
                  <Input
                    id="easy"
                    name="questionCriteria.easy"
                    type="number"
                    value={formData.questionCriteria.easy}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="medium">Medium Questions</Label>
                  <Input
                    id="medium"
                    name="questionCriteria.medium"
                    type="number"
                    value={formData.questionCriteria.medium}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="hard">Hard Questions</Label>
                  <Input
                    id="hard"
                    name="questionCriteria.hard"
                    type="number"
                    value={formData.questionCriteria.hard}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/exams')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Updating...' : 'Update Exam'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 