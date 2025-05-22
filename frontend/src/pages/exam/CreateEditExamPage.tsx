import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useToast } from '@/components/ui/use-toast';
import { examApi } from '@/lib/api';
import StudentSelector from '@/components/StudentSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Student {
  _id: string;
  name: string;
  email: string;
}

interface Exam {
  _id?: string;
  title: string;
  description: string;
  duration: number;
  startTime: string;
  endTime: string;
  questions: string[];
  allowedStudents: string[];
}

export default function CreateEditExamPage() {
  const router = useRouter();
  const { examId } = router.query;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedTab, setSelectedTab] = useState('basic-details');
  const [exam, setExam] = useState<Exam>({
    title: '',
    description: '',
    duration: 60,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    questions: [],
    allowedStudents: [],
  });

  const fetchStudents = async () => {
    try {
      console.log('Fetching available students...');
      const response = await examApi.getAvailableStudents();
      console.log('Available students response:', response);
      setStudents(response || []);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch students: ' + (error.message || 'Unknown error'),
        variant: 'destructive',
      });
    }
  };

  const fetchExamDetails = async (id: string) => {
    try {
      console.log('Fetching exam details for ID:', id);
      const examResponse = await examApi.getById(id);
      console.log('Exam details response:', examResponse);
      
      console.log('Fetching registered students for exam...');
      const registeredStudents = await examApi.getRegisteredStudents(id);
      console.log('Registered students response:', registeredStudents);
      
      setExam(prev => ({
        ...prev,
        ...examResponse,
        allowedStudents: registeredStudents?.map((student: Student) => student._id) || []
      }));
    } catch (error: any) {
      console.error('Error fetching exam details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch exam details: ' + (error.message || 'Unknown error'),
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    console.log('Component mounted or examId changed. ExamId:', examId);
    fetchStudents();
    
    if (examId) {
      fetchExamDetails(examId as string);
    }
  }, [examId]);

  // Add a handler for tab changes
  const handleTabChange = (value: string) => {
    console.log('Tab changed to:', value);
    setSelectedTab(value);
    
    if (value === 'students' && students.length === 0) {
      console.log('Students tab selected but no students loaded, fetching...');
      fetchStudents();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('Submitting form with exam data:', exam);

    try {
      if (examId) {
        // Update exam details
        const examUpdate = {
          ...exam,
          allowedStudents: undefined
        };
        console.log('Updating exam:', examUpdate);
        await examApi.update(examId as string, examUpdate);

        console.log('Updating allowed students:', exam.allowedStudents);
        await examApi.addStudents(examId as string, exam.allowedStudents);
        
        toast({
          title: 'Success',
          description: 'Exam updated successfully',
        });
      } else {
        // Create new exam
        const examCreate = {
          ...exam,
          allowedStudents: undefined
        };
        console.log('Creating new exam:', examCreate);
        const createdExam = await examApi.create(examCreate);
        console.log('Created exam response:', createdExam);

        if (exam.allowedStudents.length > 0) {
          console.log('Adding students to new exam:', exam.allowedStudents);
          await examApi.addStudents(createdExam._id, exam.allowedStudents);
        }

        toast({
          title: 'Success',
          description: 'Exam created successfully',
        });
      }
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error saving exam:', error);
      toast({
        title: 'Error',
        description: 'Failed to save exam: ' + (error.message || 'Unknown error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentsChange = (students: string[]) => {
    console.log('Selected students changed:', students);
    setExam(prev => ({ ...prev, allowedStudents: students }));
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{examId ? 'Edit Exam' : 'Create New Exam'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="basic-details">Basic Details</TabsTrigger>
              <TabsTrigger value="students">
                Students ({exam.allowedStudents.length})
              </TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit}>
              <TabsContent value="basic-details">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={exam.title}
                      onChange={(e) => setExam(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={exam.description}
                      onChange={(e) => setExam(prev => ({ ...prev, description: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        value={exam.duration}
                        onChange={(e) => setExam(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="datetime-local"
                        value={exam.startTime.slice(0, 16)}
                        onChange={(e) => setExam(prev => ({ ...prev, startTime: new Date(e.target.value).toISOString() }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="datetime-local"
                        value={exam.endTime.slice(0, 16)}
                        onChange={(e) => setExam(prev => ({ ...prev, endTime: new Date(e.target.value).toISOString() }))}
                        required
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="students">
                <div className="space-y-4">
                  {students.length > 0 ? (
                    <>
                      <div className="mb-4 p-4 bg-blue-50 rounded">
                        <p className="text-sm text-blue-600">
                          Total available students: {students.length}
                        </p>
                        <p className="text-sm text-blue-600">
                          Selected students: {exam.allowedStudents.length}
                        </p>
                      </div>
                      <StudentSelector
                        examId={examId as string}
                        selectedStudents={exam.allowedStudents}
                        onStudentsChange={handleStudentsChange}
                        availableStudents={students}
                      />
                    </>
                  ) : (
                    <div className="text-center p-4 bg-gray-50 rounded">
                      <p>Loading students...</p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={fetchStudents}
                        className="mt-2"
                      >
                        Retry Loading Students
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="questions">
                <div className="space-y-4">
                  {/* Question selection component will go here */}
                  <p>Question selection coming soon...</p>
                </div>
              </TabsContent>

              <div className="flex justify-end space-x-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : examId ? 'Update Exam' : 'Create Exam'}
                </Button>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 