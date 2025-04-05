'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { examApi } from '@/lib/api';
import BackToDashboard from '@/components/BackToDashboard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Pencil1Icon, TrashIcon, RocketIcon, PlusIcon } from '@radix-ui/react-icons';

interface Exam {
  _id: string;
  title: string;
  subject: string;
  duration: number;
  totalMarks: number;
  passingPercentage: number;
  startTime: string;
  endTime: string;
  status: 'draft' | 'upcoming' | 'ongoing' | 'completed';
  isPublished: boolean;
  createdBy: {
    _id: string;
    name: string;
  };
}

export default function Exams() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      fetchExams();
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchExams = async () => {
    try {
      const data = await examApi.getAll();
      setExams(data);
    } catch (error: any) {
      console.error('Error fetching exams:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch exams',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (examId: string) => {
    try {
      const examToDelete = exams.find(exam => exam._id === examId);
      if (!examToDelete) {
        throw new Error('Exam not found');
      }

      if (examToDelete.isPublished || examToDelete.status === 'ongoing' || examToDelete.status === 'completed') {
        throw new Error('Cannot delete published or ongoing exams');
      }

      await examApi.delete(examId);
      toast({
        title: 'Success',
        description: 'Exam deleted successfully',
      });
      await fetchExams();
    } catch (error: any) {
      console.error('Error deleting exam:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete exam',
        variant: 'destructive',
      });
    }
  };

  const handlePublish = async (examId: string) => {
    try {
      const examToPublish = exams.find(exam => exam._id === examId);
      if (!examToPublish) {
        throw new Error('Exam not found');
      }

      if (examToPublish.isPublished) {
        throw new Error('Exam is already published');
      }

      // Check if exam has questions
      const totalQuestions = 
        examToPublish.questionCriteria.easy + 
        examToPublish.questionCriteria.medium + 
        examToPublish.questionCriteria.hard;

      if (totalQuestions < 1) {
        throw new Error('Please add at least one question before publishing');
      }

      setLoading(true);
      await examApi.publish(examId);
      toast({
        title: 'Success',
        description: 'Exam published successfully',
      });
      await fetchExams();
    } catch (error: any) {
      console.error('Error publishing exam:', error);
      toast({
        title: 'Failed to Publish',
        description: error.message || 'Please ensure all required fields are filled',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (exam: Exam) => {
    if (!exam.isPublished) {
      return <Badge variant="secondary">Draft</Badge>;
    }
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);

    if (now < startTime) {
      return <Badge variant="outline">Upcoming</Badge>;
    } else if (now >= startTime && now <= endTime) {
      return <Badge variant="success">Ongoing</Badge>;
    } else {
      return <Badge variant="default">Completed</Badge>;
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <BackToDashboard />
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
          <p className="text-muted-foreground mt-2">
            {user?.role === 'student' 
              ? 'View and participate in your scheduled exams'
              : 'Create and manage your exams'}
          </p>
        </div>
        {(user?.role === 'faculty' || user?.role === 'admin') && (
          <Button onClick={() => router.push('/exams/create')}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create New Exam
          </Button>
        )}
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Exams Found</CardTitle>
            <CardDescription>
              {user?.role === 'student'
                ? "You don't have any exams scheduled yet."
                : "You haven't created any exams yet. Click the button above to create your first exam."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Exams</CardTitle>
            <CardDescription>
              {user?.role === 'student'
                ? 'Your scheduled exams are listed below'
                : 'Manage your created exams'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam._id}>
                    <TableCell className="font-medium">{exam.title}</TableCell>
                    <TableCell>{exam.subject}</TableCell>
                    <TableCell>{exam.duration} minutes</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <div>
                          <div>{new Date(exam.startTime).toLocaleDateString()}</div>
                          <div>{new Date(exam.startTime).toLocaleTimeString()} - {new Date(exam.endTime).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(exam)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {user?.role === 'student' ? (
                          <Button
                            onClick={() => router.push(`/exam/${exam._id}`)}
                            disabled={!exam.isPublished || new Date() < new Date(exam.startTime) || new Date() > new Date(exam.endTime)}
                          >
                            <RocketIcon className="mr-2 h-4 w-4" />
                            Start Exam
                          </Button>
                        ) : (
                          <>
                            {!exam.isPublished && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/exams/${exam._id}/edit`)}
                              >
                                <Pencil1Icon className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {!exam.isPublished && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Exam</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this exam? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(exam._id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}

                            {!exam.isPublished && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <RocketIcon className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Publish Exam</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to publish this exam? Once published, you cannot edit or delete it.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handlePublish(exam._id)}
                                    >
                                      Publish
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 