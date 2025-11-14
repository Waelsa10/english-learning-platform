import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { subscribeToCollection } from '@/lib/firebase/firestore';
import { Card, CardContent } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { PageSpinner } from '@/components/common/Spinner';
import { formatPercentage } from '@/utils/formatters';
import { where } from 'firebase/firestore';
import type { Student } from '@/types';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // ✅ Real-time listener for students
    const unsubscribe = subscribeToCollection<Student>(
      'users',
      (data) => {
        const studentData = data.filter(u => u.role === 'student');
        setStudents(studentData);
        setIsLoading(false);
      },
      [where('role', '==', 'student')]
    );

    return () => unsubscribe();
  }, []);

  const filteredStudents = students.filter((student) =>
    student?.profile?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <PageSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor student progress (Live Updates)
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{students.length}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {students.filter((s) => s.subscription?.status === 'active').length}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {students.filter((s) => !s.assignedTeacher).length}
              </p>
              <p className="text-sm text-muted-foreground">Unassigned</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {formatPercentage(
                  students.reduce((acc, s) => acc + (s.progress?.overallProgress || 0), 0) /
                  (students.length || 1)
                )}
              </p>
              <p className="text-sm text-muted-foreground">Avg Progress</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardContent className="p-0">
          {filteredStudents.length > 0 ? (
            <div className="divide-y">
              {filteredStudents.map((student) => (
                <div key={student.uid} className="p-6 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={student?.profile?.profilePicture}
                      fallback={student?.profile?.fullName?.charAt(0) || 'S'}
                      size="lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">
                          {student?.profile?.fullName || 'Unknown Student'}
                        </h3>
                        <Badge variant={student.englishLevel === 'advanced' ? 'success' : student.englishLevel === 'intermediate' ? 'warning' : 'info'}>
                          {student.englishLevel || 'beginner'}
                        </Badge>
                        {student.subscription?.status === 'active' && (
                          <Badge variant="success">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {student.email}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>
                          <strong>Progress:</strong> {formatPercentage(student?.progress?.overallProgress || 0)}
                        </span>
                        <span>
                          <strong>Assignments:</strong> {student?.progress?.completedAssignments || 0}/{student?.progress?.totalAssignments || 0}
                        </span>
                        <span>
                          <strong>Teacher:</strong> {student.assignedTeacher ? 'Assigned' : 'Unassigned'}
                        </span>
                      </div>
                    </div>
                    <Link to={`/students/${student.uid}`}>
                      <Button size="sm" variant="outline">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? 'No students found matching your search' : 'No students yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};