import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, TrendingUp, Award, MessageSquare, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getAssignmentsForStudent, getTeacherByUid } from '@/lib/firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { Spinner } from '@/components/common/Spinner';
import { formatRelativeTime, formatPercentage } from '@/utils/formatters';
import type { Assignment, Student, Teacher } from '@/types';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const student = user as Student;
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignmentsData, teacherData] = await Promise.all([
          getAssignmentsForStudent(student.uid),
          student.assignedTeacher
            ? getTeacherByUid(student.assignedTeacher)
            : Promise.resolve(null),
        ]);

        setAssignments(assignmentsData);
        setTeacher(teacherData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [student.uid, student.assignedTeacher]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const pendingAssignments = assignments.filter(
    (a) => !a.assignedTo.includes(student.uid)
  );
  const upcomingAssignments = assignments
    .filter((a) => new Date(a.dueDate.toDate()) > new Date())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {student.profile.fullName}!</h1>
        <p className="text-muted-foreground mt-1">
          Here's your learning progress overview
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Overall Progress
                </p>
                <p className="text-2xl font-bold mt-1">
                  {formatPercentage(student.progress.overallProgress)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed
                </p>
                <p className="text-2xl font-bold mt-1">
                  {student.progress.completedAssignments}/{student.progress.totalAssignments}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Average Score
                </p>
                <p className="text-2xl font-bold mt-1">
                  {formatPercentage(student.progress.averageScore)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Study Streak
                </p>
                <p className="text-2xl font-bold mt-1">
                  {student.progress.streak} days
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned Teacher */}
          {teacher ? (
            <Card>
              <CardHeader>
                <CardTitle>Your Teacher</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar
                    src={teacher.profile.profilePicture}
                    fallback={teacher.profile.fullName.charAt(0)}
                    size="lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{teacher.profile.fullName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {teacher.qualifications.experience} years of experience
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {teacher.qualifications.specializations.slice(0, 3).map((spec) => (
                        <Badge key={spec} variant="info">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Link to={`/messages?teacher=${teacher.uid}`}>
                    <Button variant="outline" size="sm" leftIcon={<MessageSquare className="h-4 w-4" />}>
                      Message
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Teacher Assigned Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You'll be assigned a teacher soon. In the meantime, you can explore the
                    assignment library.
                  </p>
                  <Link to="/library">
                    <Button variant="outline">Browse Library</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Assignments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upcoming Assignments</CardTitle>
              <Link to="/assignments">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingAssignments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAssignments.map((assignment) => (
                    <AssignmentCard key={assignment.id} assignment={assignment} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No upcoming assignments
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Skills Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Skills Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(student.progress.skillsBreakdown).map(([skill, progress]) => (
                  <div key={skill}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium capitalize">{skill}</span>
                      <span className="text-muted-foreground">
                        {formatPercentage(progress)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/assignments/new" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Start New Assignment
                </Button>
              </Link>
              <Link to="/progress" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Detailed Progress
                </Button>
              </Link>
              {teacher && (
                <Link to={`/messages?teacher=${teacher.uid}`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Teacher
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const AssignmentCard: React.FC<{ assignment: Assignment }> = ({ assignment }) => {
  const dueDate = assignment.dueDate.toDate();
  const now = new Date();
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Link to={`/assignments/${assignment.id}`}>
      <div className="p-4 rounded-lg border hover:bg-accent transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold">{assignment.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {assignment.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={assignment.difficulty === 'easy' ? 'success' : assignment.difficulty === 'medium' ? 'warning' : 'danger'}>
                {assignment.difficulty}
              </Badge>
              <Badge variant="info">{assignment.type}</Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">
              {daysUntilDue > 0 ? `${daysUntilDue} days` : 'Overdue'}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(dueDate)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};