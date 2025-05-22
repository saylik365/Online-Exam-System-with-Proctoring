'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Student {
  _id: string;
  name: string;
  email: string;
}

interface StudentSelectorProps {
  examId?: string;
  selectedStudents: string[];
  onStudentsChange: (students: string[]) => void;
  availableStudents: Student[];
}

export default function StudentSelector({ 
  selectedStudents, 
  onStudentsChange,
  availableStudents 
}: StudentSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleStudentToggle = (studentId: string) => {
    const newSelectedStudents = selectedStudents.includes(studentId)
      ? selectedStudents.filter(id => id !== studentId)
      : [...selectedStudents, studentId];
    onStudentsChange(newSelectedStudents);
  };

  const filteredStudents = availableStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="search">Search Students</Label>
        <Input
          id="search"
          placeholder="Search by name or email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <div key={student._id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
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
  );
}