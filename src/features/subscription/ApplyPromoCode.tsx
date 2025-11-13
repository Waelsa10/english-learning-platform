import React, { useState } from 'react';
import { Tag, Check, X } from 'lucide-react';
import { validatePromoCode } from '@/lib/firebase/promoCodes';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import toast from 'react-hot-toast';
import type { PromoCode } from '@/types';

interface ApplyPromoCodeProps {
  selectedPlan: string;
  onPromoCodeApplied: (discountPercentage: number) => void;
}

export const ApplyPromoCode: React.FC<ApplyPromoCodeProps> = ({
  selectedPlan,
  onPromoCodeApplied,
}) => {
  const { user } = useAuthStore();
  const [promoCode, setPromoCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validatedPromo, setValidatedPromo] = useState<PromoCode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    if (!promoCode.trim() || !user) return;

    setIsValidating(true);
    setError(null);

    try {
      const result = await validatePromoCode(
        promoCode.trim(),
        user.uid,
        selectedPlan
      );

      if (result.valid && result.promoCode) {
        setValidatedPromo(result.promoCode);
        onPromoCodeApplied(result.promoCode.discountPercentage);
        toast.success('Promo code applied successfully!');
      } else {
        setError(result.error || 'Invalid promo code');
        setValidatedPromo(null);
        onPromoCodeApplied(0);
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      setError('Failed to validate promo code');
      setValidatedPromo(null);
      onPromoCodeApplied(0);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    setPromoCode('');
    setValidatedPromo(null);
    setError(null);
    onPromoCodeApplied(0);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={promoCode}
          onChange={(e) => {
            setPromoCode(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="Enter promo code"
          leftIcon={<Tag className="h-4 w-4" />}
          disabled={!!validatedPromo}
          className="flex-1"
        />
        {validatedPromo ? (
          <Button variant="outline" onClick={handleRemove}>
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleValidate}
            isLoading={isValidating}
            disabled={!promoCode.trim()}
          >
            Apply
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {validatedPromo && (
        <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  Promo code applied!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  You're getting {validatedPromo.discountPercentage}% off
                </p>
                {validatedPromo.description && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {validatedPromo.description}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="success" className="ml-2">
              {validatedPromo.discountPercentage}% OFF
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};