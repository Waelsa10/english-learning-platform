import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Calendar, Award, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getAssignmentById, createSubmission } from '@/lib/firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { formatDate, formatDuration } from '@/utils/formatters';
import toast from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';
import type { Assignment, Answer } from '@/types';

export const AssignmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!id) return;

      try {
        const data = await getAssignmentById(id);
        setAssignment(data);
        
        if (data) {
          setAnswers(
            data.content.questions.map((q) => ({
              questionId: q.id,
              answer: '',
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching assignment:', error);
        toast.error('Failed to load assignment');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignment();
  }, [id]);

  useEffect(() => {
    if (isStarted) {
      const interval = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 60000); // Every minute

      return () => clearInterval(interval);
    }
  }, [isStarted]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) =>
      prev.map((a) => (a.questionId === questionId ? { ...a, answer } : a))
    );
  };

  const handleSubmit = async () => {
    if (!assignment || !user) return;

    setIsSubmitting(true);
    try {
      await createSubmission({
        assignmentId: assignment.id,
        studentId: user.uid,
        studentName: user.profile.fullName,
        submittedAt: Timestamp.now() as any,
        status: 'submitted',
        content: {
          answers,
          timeSpent,
        },
        attemptNumber: 1,
        autoSave: {
          lastSaved: Timestamp.now() as any,
          progress: 100,
        },
      });

      toast.success('Assignment submitted successfully!');
      navigate('/assignments');
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Assignment not found</p>
        <Button onClick={() => navigate('/assignments')} className="mt-4">
          Back to Assignments
        </Button>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/assignments')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Assignments
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{assignment.title}</CardTitle>
                <p className="text-muted-foreground">{assignment.description}</p>
              </div>
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
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-semibold">
                    {formatDate(assignment.dueDate.toDate())}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time Limit</p>
                  <p className="font-semibold">
                    {assignment.timeLimit
                      ? formatDuration(assignment.timeLimit)
                      : 'No limit'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                  <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Points</p>
                  <p className="font-semibold">{assignment.points}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Instructions</h3>
              <p className="text-muted-foreground">
                {assignment.content.instructions}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Overview</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {assignment.content.questions.length} questions</li>
                <li>• {assignment.attemptsAllowed} attempt(s) allowed</li>
                <li>• Type: {assignment.type}</li>
              </ul>
            </div>

            <Button onClick={() => setIsStarted(true)} size="lg" className="w-full">
              Start Assignment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{assignment.title}</h1>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">
            Time spent: {formatDuration(timeSpent)}
          </span>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {assignment.content.questions.map((question, index) => (
            <div key={question.id} className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-3">{question.question}</p>

                  {question.type === 'multiple_choice' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <label
                          key={option.id}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={option.id}
                            onChange={(e) =>
                              handleAnswerChange(question.id, e.target.value)
                            }
                            className="h-4 w-4"
                          />
                          <span>{option.text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'fill_blank' && (
                    <input
                      type="text"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2"
                      placeholder="Your answer"
                      onChange={(e) =>
                        handleAnswerChange(question.id, e.target.value)
                      }
                    />
                  )}

                  {question.type === 'essay' && (
                    <textarea
                      className="w-full min-h-[150px] rounded-lg border border-input bg-background px-3 py-2"
                      placeholder="Write your answer here..."
                      onChange={(e) =>
                        handleAnswerChange(question.id, e.target.value)
                      }
                    />
                  )}
                </div>
              </div>
              {index < assignment.content.questions.length - 1 && (
                <div className="border-t mt-6" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setIsStarted(false)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} isLoading={isSubmitting}>
          Submit Assignment
        </Button>
      </div>
    </div>
  );
};