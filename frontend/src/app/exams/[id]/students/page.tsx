'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { examApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import BackToDashboard from '@/components/BackToDashboard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface RegisteredStudent {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'pending' | 'started' | 'completed';
  startedAt?: string;
  completedAt?: string;
}

interface AvailableStudent {
  _id: string;
  name: string;
  email: string;
}

export default function ManageStudents() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<RegisteredStudent[]>([]);
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'faculty' && user?.role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'Only faculty and admins can manage student registrations',
        variant: 'destructive',
      });
      router.push('/dashboard');
      return;
    }

    fetchStudents();
    fetchAvailableStudents();
  }, [id, isAuthenticated]);

  const fetchStudents = async () => {
    try {
      const response = await examApi.getRegisteredStudents(id);
      if (!response || !Array.isArray(response)) {
        throw new Error('Invalid response format from server');
      }
      setStudents(response);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch registered students',
        variant: 'destructive',
      });
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const response = await examApi.getAllStudents();
      setAvailableStudents(response);
    } catch (error: any) {
      console.error('Error fetching available students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch available students',
        variant: 'destructive',
      });
    }
  };

  const handleAddSelectedStudents = async () => {
    try {
      if (selectedStudents.length === 0) {
        toast({
          title: 'Error',
          description: 'Please select at least one student',
          variant: 'destructive',
        });
        return;
      }

      await examApi.addStudents(id, selectedStudents);
      setSelectedStudents([]);
      fetchStudents();
      toast({
        title: 'Success',
        description: `${selectedStudents.length} student(s) added successfully`,
      });
    } catch (error: any) {
      console.error('Error adding students:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add students',
        variant: 'destructive',
      });
    }
  };

  const handleAddStudent = async () => {
    try {
      if (!newStudentEmail) {
        toast({
          title: 'Error',
          description: 'Please enter a student email',
          variant: 'destructive',
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newStudentEmail)) {
        toast({
          title: 'Error',
          description: 'Please enter a valid email address',
          variant: 'destructive',
        });
        return;
      }

      await examApi.addStudents(id, [newStudentEmail]);
      setNewStudentEmail('');
      fetchStudents();
      toast({
        title: 'Success',
        description: 'Student added successfully',
      });
    } catch (error: any) {
      console.error('Error adding student:', error);
      
      let errorMessage = 'Failed to add student';
      if (error.message.includes('No student found with email')) {
        errorMessage = 'No registered student found with this email address';
      } else if (error.message.includes('already registered')) {
        errorMessage = 'This student is already registered for the exam';
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    try {
      const response = await examApi.removeStudents(id, [studentId]);
      
      // Update the students list with the response data
      if (response.allowedStudents) {
        setStudents(response.allowedStudents);
        // Refresh available students list
        await fetchAvailableStudents();
        
        toast({
          title: 'Success',
          description: 'Student removed successfully',
        });
      }
    } catch (error: any) {
      console.error('Error removing student:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove student',
        variant: 'destructive',
      });
    }
  };

  const filteredStudents = availableStudents.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.name.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BackToDashboard />
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Manage Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Add Student by Email */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Add Student by Email</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="Enter student email"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddStudent}>Add Student</Button>
              </div>
            </div>

            {/* Add Multiple Students */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Add Multiple Students</h3>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  {filteredStudents.map((student) => (
                    <div key={student._id} className="flex items-center space-x-2 py-2">
                      <Checkbox
                        id={student._id}
                        checked={selectedStudents.includes(student._id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStudents([...selectedStudents, student._id]);
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== student._id));
                          }
                        }}
                      />
                      <Label htmlFor={student._id} className="flex-1">
                        {student.name} ({student.email})
                      </Label>
                    </div>
                  ))}
                  {filteredStudents.length === 0 && (
                    <p className="text-center text-gray-500 py-2">
                      No students found
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleAddSelectedStudents}
                  disabled={selectedStudents.length === 0}
                >
                  Add Selected Students
                </Button>
              </div>
            </div>

            {/* Registered Students */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Registered Students</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((registration) => (
                    <TableRow key={registration._id}>
                      <TableCell>{registration.student.name}</TableCell>
                      <TableCell>{registration.student.email}</TableCell>
                      <TableCell className="capitalize">{registration.status}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveStudent(registration.student._id)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {students.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No students registered
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )udent => {
    const isAlreadyRegistered = students.some(s => s.student._id === student._id);
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    return !isAlreadyRegistered && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <BackToDashboard />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manage Students</CardTitle>
          <Button variant="outline" onClick={() => router.push(`/exams/${id}`)}>
            Back to Exam
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Bulk Add Students */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Add Multiple Students</h3>
              <div className="space-y-4">
                <div>
                  <Label>Search Students</Label>
                  <Input
                    type="text"
                    placeholder="Search by name or email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
                  {filteredStudents.map((student) => (
                    <div
                      key={student._id}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-100"
                    >
                      <Checkbox
                        checked={selectedStudents.includes(student._id)}
                        onCheckedChange={(checked: boolean) => {
                          setSelectedStudents(
                            checked
                              ? [...selectedStudents, student._id]
                              : selectedStudents.filter(id => id !== student._id)
                          );
                        }}
                      />
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  ))}
                  {filteredStudents.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No students found
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleAddSelectedStudents}
                  disabled={selectedStudents.length === 0}
                >
                  Add Selected Students ({selectedStudents.length})
                </Button>
              </div>
            </div>

            {/* Manual Add Student */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Add Student by Email</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="studentEmail">Student Email</Label>
                  <Input
                    id="studentEmail"
                    type="email"
                    placeholder="Enter student email"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddStudent}>Add Student</Button>
                </div>
              </div>
            </div>

            {/* Registered Students Table */}
            <div>
              <h3 className="text-lg font-medium mb-4">Registered Students</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started At</TableHead>
                    <TableHead>Completed At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell>{student.student?.name || '-'}</TableCell>
                      <TableCell>{student.student?.email || '-'}</TableCell>
                      <TableCell>{student.status}</TableCell>
                      <TableCell>
                        {student.startedAt
                          ? new Date(student.startedAt).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {student.completedAt
                          ? new Date(student.completedAt).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          onClick={() => handleRemoveStudent(student._id)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {students.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No students registered yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}