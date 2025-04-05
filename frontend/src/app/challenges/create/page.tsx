'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import BackToDashboard from '@/components/BackToDashboard';
import { fetchApi } from '@/lib/api';

interface ChallengeFormData {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  starterCode: string;
  solution: string;
  testCases: {
    input: string;
    output: string;
  }[];
  timeLimit: number;
  memoryLimit: number;
}

export default function CreateChallengePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ChallengeFormData>({
    title: '',
    description: '',
    difficulty: 'medium',
    category: 'algorithms',
    starterCode: '// Write your code here\n\n',
    solution: '',
    testCases: [{ input: '', output: '' }],
    timeLimit: 1000, // 1 second
    memoryLimit: 256, // 256 MB
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetchApi('/api/challenges', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      toast({
        title: 'Success',
        description: 'Challenge created successfully!',
      });
      router.push('/challenges');
    } catch (error: any) {
      console.error('Error creating challenge:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create challenge. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addTestCase = () => {
    setFormData(prev => ({
      ...prev,
      testCases: [...prev.testCases, { input: '', output: '' }],
    }));
  };

  const updateTestCase = (index: number, field: 'input' | 'output', value: string) => {
    setFormData(prev => ({
      ...prev,
      testCases: prev.testCases.map((tc, i) => 
        i === index ? { ...tc, [field]: value } : tc
      ),
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <BackToDashboard />
      <Card>
        <CardHeader>
          <CardTitle>Create New Challenge</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                    setFormData(prev => ({ ...prev, difficulty: value }))
                  }
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

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="starterCode">Starter Code</Label>
              <Textarea
                id="starterCode"
                value={formData.starterCode}
                onChange={(e) => setFormData(prev => ({ ...prev, starterCode: e.target.value }))}
                required
                className="font-mono min-h-[150px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solution">Solution</Label>
              <Textarea
                id="solution"
                value={formData.solution}
                onChange={(e) => setFormData(prev => ({ ...prev, solution: e.target.value }))}
                required
                className="font-mono min-h-[150px]"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Test Cases</Label>
                <Button type="button" onClick={addTestCase}>
                  Add Test Case
                </Button>
              </div>
              {formData.testCases.map((testCase, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor={`input-${index}`}>Input</Label>
                    <Textarea
                      id={`input-${index}`}
                      value={testCase.input}
                      onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`output-${index}`}>Expected Output</Label>
                    <Textarea
                      id={`output-${index}`}
                      value={testCase.output}
                      onChange={(e) => updateTestCase(index, 'output', e.target.value)}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit (ms)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  value={formData.timeLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                  required
                  min="100"
                  max="5000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memoryLimit">Memory Limit (MB)</Label>
                <Input
                  id="memoryLimit"
                  type="number"
                  value={formData.memoryLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, memoryLimit: parseInt(e.target.value) }))}
                  required
                  min="16"
                  max="512"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                onClick={() => router.push('/challenges')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Challenge'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 