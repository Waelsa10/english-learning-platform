import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Save } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { createAssignment } from '@/lib/firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import toast from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';

const assignmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['reading', 'writing', 'listening', 'speaking', 'grammar', 'vocabulary']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  points: z.number().min(1, 'Points must be at least 1'),
  dueDate: z.string(),
  timeLimit: z.number().optional(),
  attemptsAllowed: z.number().min(1),
  questions: z.array(
    z.object({
      question: z.string().min(1, 'Question is required'),
      type: z.enum(['multiple_choice', 'fill_blank', 'essay']),
      points: z.number().min(1),
    })
  ),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

export const AssignmentCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      attemptsAllowed: 1,
      questions: [{ question: '', type: 'multiple_choice', points: 10 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  });

  const onSubmit = async (data: AssignmentFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const assignmentData = {
        title: data.title,
        description: data.description,
        type: data.type,
        difficulty: data.difficulty,
        createdBy: user.uid,
        createdByName: user.profile.fullName,
        assignedTo: [],
        content: {
          instructions: data.description,
          questions: data.questions.map((q, idx) => ({
            id: `q${idx + 1}`,
            type: q.type,
            question: q.question,
            points: q.points,
          })),
        },
        dueDate: Timestamp.fromDate(new Date(data.dueDate)),
        dueDateUTC: Timestamp.fromDate(new Date(data.dueDate)),
        createdInTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        points: data.points,
        timeLimit: data.timeLimit,
        attemptsAllowed: data.attemptsAllowed,
        isTemplate: false,
        assignmentSource: 'teacher_created' as const,
        isActive: true,
      };

      await createAssignment(assignmentData);
      toast.success('Assignment created successfully!');
      navigate('/assignments');
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Assignment</h1>
        <p className="text-muted-foreground mt-1">
          Create a new assignment for your students
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              {...register('title')}
              label="Title"
              placeholder="Assignment title"
              error={errors.title?.message}
            />

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Description
              </label>
              <textarea
                {...register('description')}
                className="w-full min-h-[100px] rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Assignment description and instructions"
              />
              {errors.description && (
                <p className="mt-1.5 text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                {...register('type')}
                label="Type"
                error={errors.type?.message}
                options={[
                  { value: 'reading', label: 'Reading' },
                  { value: 'writing', label: 'Writing' },
                  { value: 'listening', label: 'Listening' },
                  { value: 'speaking', label: 'Speaking' },
                  { value: 'grammar', label: 'Grammar' },
                  { value: 'vocabulary', label: 'Vocabulary' },
                ]}
              />

              <Select
                {...register('difficulty')}
                label="Difficulty"
                error={errors.difficulty?.message}
                options={[
                  { value: 'easy', label: 'Easy' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'hard', label: 'Hard' },
                ]}
              />

              <Input
                {...register('points', { valueAsNumber: true })}
                type="number"
                label="Total Points"
                error={errors.points?.message}
              />

              <Input
                {...register('dueDate')}
                type="datetime-local"
                label="Due Date"
                error={errors.dueDate?.message}
              />

              <Input
                {...register('timeLimit', { valueAsNumber: true })}
                type="number"
                label="Time Limit (minutes, optional)"
                error={errors.timeLimit?.message}
              />

              <Input
                {...register('attemptsAllowed', { valueAsNumber: true })}
                type="number"
                label="Attempts Allowed"
                error={errors.attemptsAllowed?.message}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Questions</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ question: '', type: 'multiple_choice', points: 10 })
              }
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Question
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Question {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <Input
                  {...register(`questions.${index}.question`)}
                  placeholder="Enter question"
                  error={errors.questions?.[index]?.question?.message}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    {...register(`questions.${index}.type`)}
                    options={[
                      { value: 'multiple_choice', label: 'Multiple Choice' },
                      { value: 'fill_blank', label: 'Fill in the Blank' },
                      { value: 'essay', label: 'Essay' },
                    ]}
                  />

                  <Input
                    {...register(`questions.${index}.points`, {
                      valueAsNumber: true,
                    })}
                    type="number"
                    placeholder="Points"
                    error={errors.questions?.[index]?.points?.message}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/assignments')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Create Assignment
          </Button>
        </div>
      </form>
    </div>
  );
};