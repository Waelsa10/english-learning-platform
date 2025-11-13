import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { createPromoCode } from '@/lib/firebase/promoCodes';
import { Modal, ModalContent, ModalFooter } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import toast from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';

const promoCodeSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(20, 'Code must be less than 20 characters')
    .regex(/^[A-Z0-9]+$/, 'Code must be uppercase letters and numbers only'),
  discountPercentage: z
    .number()
    .min(1, 'Discount must be at least 1%')
    .max(100, 'Discount cannot exceed 100%'),
  description: z.string().optional(),
  validFrom: z.string(),
  validUntil: z.string(),
  usageLimit: z.number().min(1).optional(),
  applicablePlans: z.array(z.string()),
});

type PromoCodeFormData = z.infer<typeof promoCodeSchema>;

interface CreatePromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreatePromoCodeModal: React.FC<CreatePromoCodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [hasUsageLimit, setHasUsageLimit] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PromoCodeFormData>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      applicablePlans: [],
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    },
  });

  const onSubmit = async (data: PromoCodeFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      await createPromoCode({
        code: data.code.toUpperCase(),
        discountPercentage: data.discountPercentage,
        description: data.description,
        validFrom: Timestamp.fromDate(new Date(data.validFrom)),
        validUntil: Timestamp.fromDate(new Date(data.validUntil)),
        usageLimit: hasUsageLimit ? data.usageLimit || null : null,
        isActive: true,
        applicablePlans: data.applicablePlans as any,
        createdBy: user.uid,
        createdByName: user.profile.fullName,
      });

      toast.success('Promo code created successfully!');
      reset();
      setHasUsageLimit(false);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating promo code:', error);
      toast.error('Failed to create promo code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setHasUsageLimit(false);
    onClose();
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue('code', code);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Promo Code" size="md">
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalContent>
          <div className="space-y-4">
            <div>
              <div className="flex gap-2">
                <Input
                  {...register('code')}
                  label="Promo Code"
                  placeholder="SUMMER2024"
                  error={errors.code?.message}
                  className="flex-1"
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                    register('code').onChange(e);
                  }}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateRandomCode}
                  >
                    Generate
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Letters and numbers only, automatically converted to uppercase
              </p>
            </div>

            <Input
              {...register('discountPercentage', { valueAsNumber: true })}
              type="number"
              label="Discount Percentage"
              placeholder="20"
              error={errors.discountPercentage?.message}
              min="1"
              max="100"
            />

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Description (Optional)
              </label>
              <textarea
                {...register('description')}
                className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g., Summer promotion for new students"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                {...register('validFrom')}
                type="date"
                label="Valid From"
                error={errors.validFrom?.message}
              />
              <Input
                {...register('validUntil')}
                type="date"
                label="Valid Until"
                error={errors.validUntil?.message}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={hasUsageLimit}
                  onChange={(e) => setHasUsageLimit(e.target.checked)}
                  className="rounded border-input"
                />
                <span className="text-sm font-medium">Set Usage Limit</span>
              </label>
              {hasUsageLimit && (
                <Input
                  {...register('usageLimit', { valueAsNumber: true })}
                  type="number"
                  placeholder="100"
                  error={errors.usageLimit?.message}
                  min="1"
                />
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Leave unchecked for unlimited usage
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Applicable Plans
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value="basic"
                    {...register('applicablePlans')}
                    className="rounded border-input"
                  />
                  <span className="text-sm">Basic Plan</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value="premium"
                    {...register('applicablePlans')}
                    className="rounded border-input"
                  />
                  <span className="text-sm">Premium Plan</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value="enterprise"
                    {...register('applicablePlans')}
                    className="rounded border-input"
                  />
                  <span className="text-sm">Enterprise Plan</span>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leave all unchecked to apply to all plans
              </p>
            </div>
          </div>
        </ModalContent>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Promo Code
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};