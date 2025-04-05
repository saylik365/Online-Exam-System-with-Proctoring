'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { questionApi } from '@/lib/api';
import BackToDashboard from '@/components/BackToDashboard';

export default function CreateQuestion() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    text: '',
    subject: '',
    difficulty: 'easy',
    options: ['', '', '', ''],
    correctOption: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await questionApi.create(formData);
      toast({
        title: 'Success',
        description: 'Question created successfully',
      });
      router.push('/questions');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create question',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6"
    >
      <BackToDashboard />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Create Question</CardTitle>
          <Button variant="outline" onClick={() => router.push('/questions')}>
            Cancel
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="text">Question Text</Label>
              <Input
                id="text"
                value={formData.text}
                onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label>Options</Label>
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData(prev => ({ ...prev, correctOption: index }))}
                    className={formData.correctOption === index ? 'bg-green-100' : ''}
                  >
                    Correct
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Question'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
} 