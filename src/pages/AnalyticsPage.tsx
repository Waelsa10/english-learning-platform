import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getAllStudents, getAssignmentsByTeacher } from '@/lib/firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { PageSpinner } from '@/components/common/Spinner';
import { TrendingUp, Users, BookOpen, Award } from 'lucide-react';
import { formatPercentage } from '@/utils/formatters';

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      if (user?.role === 'admin') {
        const studentsData = await getAllStudents();
        setStudents(studentsData);
      } else if (user?.role === 'teacher') {
        const [studentsData, assignmentsData] = await Promise.all([
          getAllStudents(),
          getAssignmentsByTeacher(user.uid),
        ]);
        setStudents(studentsData);
        setAssignments(assignmentsData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <PageSpinner />;
  }

  const avgProgress = students.reduce((acc, s) => acc + (s.progress?.overallProgress || 0), 0) / (students.length || 1);
  const avgScore = students.reduce((acc, s) => acc + (s.progress?.averageScore || 0), 0) / (students.length || 1);
  const totalAssignments = students.reduce((acc, s) => acc + (s.progress?.totalAssignments || 0), 0);
  const completedAssignments = students.reduce((acc, s) => acc + (s.progress?.completedAssignments || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Overview of student performance and progress
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatPercentage(avgProgress)}</p>
                <p className="text-sm text-muted-foreground">Avg Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedAssignments}/{totalAssignments}</p>
                <p className="text-sm text-muted-foreground">Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatPercentage(avgScore)}</p>
                <p className="text-sm text-muted-foreground">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {students
              .sort((a, b) => (b.progress?.overallProgress || 0) - (a.progress?.overallProgress || 0))
              .slice(0, 5)
              .map((student, index) => (
                <div key={student.uid} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{student?.profile?.fullName || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPercentage(student.progress?.overallProgress || 0)}</p>
                    <p className="text-sm text-muted-foreground">Progress</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};