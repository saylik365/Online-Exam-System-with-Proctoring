'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { examApi } from '@/lib/api';
import BackToDashboard from '@/components/BackToDashboard';

interface Params {
  id: string;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'WARNED' | 'TERMINATED';
  violations: Array<{
    type: string;
    timestamp: string;
    details: string;
  }>;
  warningCount: number;
}

export default function ExamMonitoring() {
  const params = useParams() as Params;
  const router = useRouter();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
    const interval = setInterval(fetchStudents, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await examApi.getExamMonitoring(params.id);
      setStudents(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch monitoring data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTerminate = async (studentId: string) => {
    if (!confirm('Are you sure you want to terminate this student\'s exam?')) {
      return;
    }

    try {
      await examApi.terminateExam(params.id, studentId);
      toast({
        title: 'Success',
        description: 'Student exam terminated',
      });
      fetchStudents();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to terminate exam',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'WARNED':
        return 'bg-yellow-500';
      case 'TERMINATED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getViolationColor = (type: string) => {
    switch (type) {
      case 'MULTIPLE_FACES':
      case 'MOBILE_DETECTED':
        return 'bg-red-500';
      case 'NO_FACE':
      case 'EYE_MOVEMENT':
        return 'bg-yellow-500';
      case 'BACKGROUND_NOISE':
      case 'TAB_SWITCH':
        return 'bg-orange-500';
      default:
        return 'bg-blue-500';
    }
  };

  if (loading) {
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
      <BackToDashboard />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Live Exam Monitoring</CardTitle>
          <Button onClick={() => router.push('/exams')}>Back to Exams</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Warnings</TableHead>
                <TableHead>Recent Violations</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow
                  key={student._id}
                  className={selectedStudent === student._id ? 'bg-muted/50' : ''}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {student.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(student.status)}>
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{student.warningCount}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {student.violations.slice(-3).map((violation, index) => (
                        <Badge
                          key={index}
                          className={getViolationColor(violation.type)}
                          title={`${violation.details} at ${new Date(
                            violation.timestamp
                          ).toLocaleTimeString()}`}
                        >
                          {violation.type}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      onClick={() => handleTerminate(student._id)}
                      disabled={student.status === 'TERMINATED'}
                    >
                      Terminate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {students.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No students currently taking the exam.
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
} 