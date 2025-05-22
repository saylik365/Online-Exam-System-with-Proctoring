'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Student {
  _id: string;
  name: string;
  email: string;
}

interface ExamStudentSelectorProps {
  examId: string;
}

export default function ExamStudentSelector({ examId }: ExamStudentSelectorProps) {
  console.log('ExamStudentSelector mounted with examId:', examId);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('ExamStudentSelector useEffect triggered with examId:', examId);
    if (!examId) {
      console.error('No examId provided to ExamStudentSelector');
      return;
    }
    fetchAvailableStudents();
    fetchRegisteredStudents();
  }, [examId]);

  const fetchAvailableStudents = async () => {
    try {
      console.log('Fetching available students...');
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      console.log('Using token:', token ? 'Token exists' : 'No token found');
      
      const response = await fetch('http://localhost:5000/api/exams/available-students', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Available students API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Available students data:', data);
      setStudents(data);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch students: ' + (error.message || 'Unknown error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredStudents = async () => {
    try {
      console.log('Fetching registered students for exam ID:', examId);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/exams/${examId}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch registered students');
      }

      const data = await response.json();
      console.log('Registered students:', data);
      setSelectedStudents(data.map((student: Student) => student._id));
    } catch (error: any) {
      console.error('Error fetching registered students:', error);
      // Don't show toast for this error, as it might not be critical
    }
  };

  const saveStudentSelection = async () => {
    try {
      console.log('Saving student selection:', selectedStudents);
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/exams/${examId}/students`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentIds: selectedStudents })
      });

      if (!response.ok) {
        throw new Error('Failed to update students');
      }

      toast({
        title: 'Success',
        description: 'Students updated successfully',
      });
    } catch (error: any) {
      console.error('Error saving student selection:', error);
      toast({
        title: 'Error',
        description: 'Failed to update students: ' + (error.message || 'Unknown error'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleRemoveStudent = (studentId: string) => {
    setSelectedStudents(prev => prev.filter(id => id !== studentId));
  };

  const getSelectedStudentDetails = () => {
    return students.filter(student => selectedStudents.includes(student._id));
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Select Students for this Exam</h3>
        <Button 
          onClick={saveStudentSelection} 
          disabled={saving || selectedStudents.length === 0}
          className="ml-auto"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Students'
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="mb-4 p-4 bg-blue-50 rounded">
            <p className="text-sm text-blue-600">
              Total available students: {students.length}
            </p>
            <p className="text-sm text-blue-600">
              Selected students: {selectedStudents.length}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="search">Search Students</Label>
            <Input
              id="search"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading students...</span>
            </div>
          ) : (
            <div className="border rounded-md">
              <div className="space-y-1 max-h-[400px] overflow-y-auto p-2">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <div key={student._id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 border-b">
                      <Checkbox
                        id={student._id}
                        checked={selectedStudents.includes(student._id)}
                        onCheckedChange={() => handleStudentToggle(student._id)}
                      />
                      <Label htmlFor={student._id} className="flex-1 cursor-pointer">
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">{student.email}</div>
                      </Label>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground p-4 bg-gray-50 rounded">
                    {searchTerm ? 'No students found matching your search' : 'No students available'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Selected Students</h4>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getSelectedStudentDetails().length > 0 ? (
                  getSelectedStudentDetails().map((student) => (
                    <TableRow key={student._id}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStudent(student._id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No students selected
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={saveStudentSelection}
          disabled={saving || selectedStudents.length === 0}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Students'
          )}
        </Button>
      </div>
    </div>
  );
} 