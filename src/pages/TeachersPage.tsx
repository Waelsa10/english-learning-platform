import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Check, X } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { subscribeToCollection } from '@/lib/firebase/firestore';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { PageSpinner } from '@/components/common/Spinner';
import { where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import type { Teacher } from '@/types';

export const TeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');

  useEffect(() => {
    const unsubscribe = subscribeToCollection<Teacher>(
      'users',
      (data) => {
        const teacherData = data.filter(u => u.role === 'teacher');
        setTeachers(teacherData);
        setIsLoading(false);
      },
      [where('role', '==', 'teacher')]
    );

    return () => unsubscribe();
  }, []);

  const handleApprove = async (teacherId: string) => {
    try {
      const docRef = doc(db, 'users', teacherId);
      
      // ✅ Simple update without nested field paths
      await updateDoc(docRef, {
        isApproved: true,
        updatedAt: serverTimestamp(),
      });
      
      toast.success('Teacher approved successfully');
    } catch (error: any) {
      console.error('Error approving teacher:', error);
      toast.error(error.message || 'Failed to approve teacher');
    }
  };

  const handleReject = async (teacherId: string) => {
    try {
      const docRef = doc(db, 'users', teacherId);
      
      // ✅ Simple update without nested field paths
      await updateDoc(docRef, {
        isApproved: false,
        updatedAt: serverTimestamp(),
      });
      
      toast.success('Teacher rejected');
    } catch (error: any) {
      console.error('Error rejecting teacher:', error);
      toast.error(error.message || 'Failed to reject teacher');
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    if (filter === 'approved') return teacher.isApproved === true;
    if (filter === 'pending') return teacher.isApproved === false || teacher.isApproved === undefined;
    return true;
  });

  if (isLoading) {
    return <PageSpinner />;
  }

  const stats = [
    {
      id: 'total',
      value: teachers.length,
      label: 'Total Teachers',
      color: 'default'
    },
    {
      id: 'approved',
      value: teachers.filter((t) => t.isApproved).length,
      label: 'Approved',
      color: 'green'
    },
    {
      id: 'pending',
      value: teachers.filter((t) => !t.isApproved).length,
      label: 'Pending Approval',
      color: 'yellow'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teachers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your teaching staff (Live Updates)
          </p>
        </div>
        <Button leftIcon={<UserPlus className="h-4 w-4" />}>
          Invite Teacher
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.id}>
            <CardContent className="p-6">
              <div className="text-center">
                <p className={`text-2xl font-bold ${
                  stat.color === 'green' ? 'text-green-600' : 
                  stat.color === 'yellow' ? 'text-yellow-600' : ''
                }`}>
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All ({teachers.length})
        </Button>
        <Button
          variant={filter === 'approved' ? 'default' : 'outline'}
          onClick={() => setFilter('approved')}
          size="sm"
        >
          Approved ({teachers.filter((t) => t.isApproved).length})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
          size="sm"
        >
          Pending ({teachers.filter((t) => !t.isApproved).length})
        </Button>
      </div>

      {/* Teachers List */}
      <Card>
        <CardContent className="p-0">
          {filteredTeachers.length > 0 ? (
            <div className="divide-y">
              {filteredTeachers.map((teacher) => (
                <div 
                  key={teacher.uid || teacher.id} 
                  className="p-6 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={teacher?.profile?.profilePicture}
                      fallback={teacher?.profile?.fullName?.charAt(0) || 'T'}
                      size="lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">
                          {teacher?.profile?.fullName || 'Unknown Teacher'}
                        </h3>
                        {teacher.isApproved ? (
                          <Badge variant="success">Approved</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {teacher.email}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>
                          <strong>Experience:</strong> {teacher?.profile?.experience || 'Not specified'}
                        </span>
                        <span>
                          <strong>Specialization:</strong> {teacher?.profile?.specialization || 'General'}
                        </span>
                        <span>
                          <strong>Students:</strong> {teacher?.assignedStudents?.length || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!teacher.isApproved && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(teacher.uid || teacher.id)}
                            leftIcon={<Check className="h-4 w-4" />}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(teacher.uid || teacher.id)}
                            leftIcon={<X className="h-4 w-4" />}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Link to={`/teachers/${teacher.uid || teacher.id}`}>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No teachers found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};