import React, { useEffect, useState } from 'react';
import { getPromoCodeUsage } from '@/lib/firebase/promoCodes';
import { Modal, ModalContent } from '@/components/common/Modal';
import { Avatar } from '@/components/common/Avatar';
import { Spinner } from '@/components/common/Spinner';
import { formatDate } from '@/utils/formatters';
import type { PromoCode, PromoCodeUsage } from '@/types';

interface PromoCodeUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoCode: PromoCode;
}

export const PromoCodeUsageModal: React.FC<PromoCodeUsageModalProps> = ({
  isOpen,
  onClose,
  promoCode,
}) => {
  const [usage, setUsage] = useState<PromoCodeUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const data = await getPromoCodeUsage(promoCode.id);
        setUsage(data);
      } catch (error) {
        console.error('Error fetching usage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchUsage();
    }
  }, [promoCode.id, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Usage History - ${promoCode.code}`}
      size="lg"
    >
      <ModalContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : usage.length > 0 ? (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {usage.map((item) => (
              <div key={item.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar
                    fallback={item.userName.charAt(0)}
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{item.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      Applied {formatDate(item.appliedAt.toDate(), 'PPpp')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {item.discountPercentage}% OFF
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No one has used this promo code yet
          </div>
        )}
      </ModalContent>
    </Modal>
  );
};