import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, CheckCircle, Clock, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  getTeacherStudents,
  getAssignmentsByTeacher,
  getSubmissionsForAssignment,
} from '@/lib/firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Spinner, PageSpinner } from '@/components/common/Spinner';
import { formatPercentage } from '@/utils/formatters';
import type { Student, Assignment, Submission, Teacher } from '@/types';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Add user validation
  useEffect(() => {
    if (!user || !user.uid) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [studentsData, assignmentsData] = await Promise.all([
          getTeacherStudents(user.uid),
          getAssignmentsByTeacher(user.uid),
        ]);

        setStudents(studentsData);
        setAssignments(assignmentsData);

        // Get pending submissions
        const allSubmissions: Submission[] = [];
        for (const assignment of assignmentsData) {
          const submissions = await getSubmissionsForAssignment(assignment.id);
          allSubmissions.push(
            ...submissions.filter((s) => s.status === 'submitted')
          );
        }
        setPendingSubmissions(allSubmissions);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.uid]); // ✅ Use optional chaining

  // ✅ Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageSpinner />
      </div>
    );
  }

  // ✅ No user state
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            Unable to load dashboard. Please sign in again.
          </p>
        </Card>
      </div>
    );
  }

  const averageStudentProgress =
    students.reduce((acc, s) => acc + (s.progress?.overallProgress || 0), 0) /
    (students.length || 1);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.profile?.fullName || 'Teacher'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your students and assignments
          </p>
        </div>
        <Link to="/assignments/create">
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Create Assignment
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Students
                </p>
                <p className="text-2xl font-bold mt-1">{students.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Assignments
                </p>
                <p className="text-2xl font-bold mt-1">{assignments.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Reviews
                </p>
                <p className="text-2xl font-bold mt-1">{pendingSubmissions.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg. Progress
                </p>
                <p className="text-2xl font-bold mt-1">
                  {formatPercentage(averageStudentProgress)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Students</CardTitle>
            <Link to="/students">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {students.length > 0 ? (
              <div className="space-y-3">
                {students.slice(0, 5).map((student) => (
                  <StudentCard key={student.uid} student={student} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No students assigned yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Submissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Reviews</CardTitle>
            <Link to="/assignments?filter=pending">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingSubmissions.length > 0 ? (
              <div className="space-y-3">
                {pendingSubmissions.slice(0, 5).map((submission) => (
                  <SubmissionCard key={submission.id} submission={submission} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No pending submissions
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StudentCard: React.FC<{ student: Student }> = ({ student }) => {
  return (
    <Link to={`/students/${student.uid}`}>
      <div className="p-4 rounded-lg border hover:bg-accent transition-colors">
        <div className="flex items-center gap-3">
          <Avatar
            src={student?.profile?.profilePicture}
            fallback={student?.profile?.fullName?.charAt(0) || 'S'}
            size="md"
          />
          <div className="flex-1">
            <h4 className="font-semibold">{student?.profile?.fullName || 'Unknown Student'}</h4>
            <p className="text-sm text-muted-foreground">
              {student?.progress?.completedAssignments || 0} / {student?.progress?.totalAssignments || 0}{' '}
              assignments
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">
              {formatPercentage(student?.progress?.overallProgress || 0)}
            </p>
            <Badge variant={
              student?.englishLevel === 'advanced' ? 'success' : 
              student?.englishLevel === 'intermediate' ? 'warning' : 
              'info'
            }>
              {student?.englishLevel || 'beginner'}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  );
};

const SubmissionCard: React.FC<{ submission: Submission }> = ({ submission }) => {
  return (
    <Link to={`/submissions/${submission.id}`}>
      <div className="p-4 rounded-lg border hover:bg-accent transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">{submission?.studentName || 'Unknown Student'}</h4>
            <p className="text-sm text-muted-foreground">
              Submitted {submission?.submittedAt?.toDate 
                ? formatRelativeTime(submission.submittedAt.toDate())
                : 'recently'
              }
            </p>
          </div>
          <Badge variant="warning">Review</Badge>
        </div>
      </div>
    </Link>
  );
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${diffInDays}d ago`;
}