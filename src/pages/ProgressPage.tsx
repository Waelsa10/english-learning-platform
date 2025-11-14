import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { TrendingUp, Award, Target, Clock } from 'lucide-react';
import { formatPercentage } from '@/utils/formatters';
import type { Student } from '@/types';

export const ProgressPage: React.FC = () => {
  const { user } = useAuthStore();
  const student = user as Student;

  if (!student || !student.progress) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No progress data available</p>
      </div>
    );
  }

  const { progress } = student;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Progress</h1>
        <p className="text-muted-foreground mt-1">
          Track your learning journey
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatPercentage(progress.overallProgress)}</p>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {progress.completedAssignments}/{progress.totalAssignments}
                </p>
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
                <p className="text-2xl font-bold">{formatPercentage(progress.averageScore)}</p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{progress.streak}</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Skills Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(progress.skillsBreakdown).map(([skill, value]) => (
              <div key={skill}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium capitalize">{skill}</span>
                  <span className="text-muted-foreground">{formatPercentage(value)}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learning Goals */}
      {student.learningGoals && student.learningGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Learning Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {student.learningGoals.map((goal, index) => (
                <div key={index} className="flex items-center gap-2 p-3 rounded-lg border">
                  <Target className="h-5 w-5 text-primary" />
                  <span>{goal}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};