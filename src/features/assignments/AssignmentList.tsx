import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  getAssignmentsForStudent,
  getAssignmentsByTeacher,
  queryDocuments,
} from '@/lib/firebase/firestore';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { formatRelativeTime } from '@/utils/formatters';
import { where } from 'firebase/firestore';
import type { Assignment } from '@/types';

export const AssignmentList: React.FC = () => {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        let data: Assignment[] = [];

        if (user?.role === 'student') {
          data = await getAssignmentsForStudent(user.uid);
        } else if (user?.role === 'teacher') {
          data = await getAssignmentsByTeacher(user.uid);
        } else if (user?.role === 'admin') {
          data = await queryDocuments<Assignment>('assignments', [
            where('isActive', '==', true),
          ]);
        }

        setAssignments(data);
        setFilteredAssignments(data);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [user]);

  useEffect(() => {
    let filtered = assignments;

    if (searchTerm) {
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((a) => a.type === filterType);
    }

    if (filterDifficulty !== 'all') {
      filtered = filtered.filter((a) => a.difficulty === filterDifficulty);
    }

    setFilteredAssignments(filtered);
  }, [searchTerm, filterType, filterDifficulty, assignments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === 'student'
              ? 'Complete your assignments to progress'
              : 'Manage and create assignments'}
          </p>
        </div>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <Link to="/assignments/create">
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              Create Assignment
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'reading', label: 'Reading' },
                { value: 'writing', label: 'Writing' },
                { value: 'listening', label: 'Listening' },
                { value: 'speaking', label: 'Speaking' },
                { value: 'grammar', label: 'Grammar' },
                { value: 'vocabulary', label: 'Vocabulary' },
              ]}
            />
            <Select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              options={[
                { value: 'all', label: 'All Difficulties' },
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Assignments Grid */}
      {filteredAssignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No assignments found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const AssignmentCard: React.FC<{ assignment: Assignment }> = ({ assignment }) => {
  const dueDate = assignment.dueDate.toDate();
  const now = new Date();
  const isOverdue = dueDate < now;

  return (
    <Link to={`/assignments/${assignment.id}`}>
      <Card hover className="h-full">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-lg line-clamp-2">
                {assignment.title}
              </h3>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2">
              {assignment.description}
            </p>

            <div className="flex flex-wrap gap-2">
              <Badge
                variant={
                  assignment.difficulty === 'easy'
                    ? 'success'
                    : assignment.difficulty === 'medium'
                    ? 'warning'
                    : 'danger'
                }
              >
                {assignment.difficulty}
              </Badge>
              <Badge variant="info">{assignment.type}</Badge>
              <Badge variant="default">{assignment.points} pts</Badge>
            </div>

            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Due Date</span>
                <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                  {formatRelativeTime(dueDate)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};