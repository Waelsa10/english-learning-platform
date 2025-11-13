import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Users, Eye } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  getAllPromoCodes,
  togglePromoCodeStatus,
  getPromoCodeUsage,
} from '@/lib/firebase/promoCodes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { Modal, ModalContent } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatDate, formatPercentage } from '@/utils/formatters';
import { CreatePromoCodeModal } from './CreatePromoCodeModal';
import { PromoCodeUsageModal } from './PromoCodeUsageModal';
import toast from 'react-hot-toast';
import type { PromoCode } from '@/types';

export const PromoCodeManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPromoCode, setSelectedPromoCode] = useState<PromoCode | null>(null);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [toggleConfirm, setToggleConfirm] = useState<{
    show: boolean;
    promoCode: PromoCode | null;
  }>({ show: false, promoCode: null });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const data = await getAllPromoCodes();
      setPromoCodes(data);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast.error('Failed to load promo codes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (promoCode: PromoCode) => {
    try {
      await togglePromoCodeStatus(promoCode.id, !promoCode.isActive);
      toast.success(
        `Promo code ${promoCode.isActive ? 'deactivated' : 'activated'} successfully`
      );
      fetchPromoCodes();
    } catch (error) {
      toast.error('Failed to update promo code');
    } finally {
      setToggleConfirm({ show: false, promoCode: null });
    }
  };

  const handleViewUsage = (promoCode: PromoCode) => {
    setSelectedPromoCode(promoCode);
    setShowUsageModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promo Codes</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage promotional discount codes
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Promo Code
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Total Codes</p>
            <p className="text-2xl font-bold mt-1">{promoCodes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Active Codes</p>
            <p className="text-2xl font-bold mt-1">
              {promoCodes.filter((p) => p.isActive).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Total Uses</p>
            <p className="text-2xl font-bold mt-1">
              {promoCodes.reduce((acc, p) => acc + p.usageCount, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Avg. Discount</p>
            <p className="text-2xl font-bold mt-1">
              {formatPercentage(
                promoCodes.reduce((acc, p) => acc + p.discountPercentage, 0) /
                  (promoCodes.length || 1)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Promo Codes List */}
      <Card>
        <CardHeader>
          <CardTitle>All Promo Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {promoCodes.length > 0 ? (
            <div className="space-y-3">
              {promoCodes.map((promoCode) => (
                <PromoCodeCard
                  key={promoCode.id}
                  promoCode={promoCode}
                  onToggle={(pc) => setToggleConfirm({ show: true, promoCode: pc })}
                  onViewUsage={handleViewUsage}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No promo codes created yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowCreateModal(true)}
              >
                Create First Promo Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <CreatePromoCodeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchPromoCodes}
      />

      {/* Usage Modal */}
      {selectedPromoCode && (
        <PromoCodeUsageModal
          isOpen={showUsageModal}
          onClose={() => {
            setShowUsageModal(false);
            setSelectedPromoCode(null);
          }}
          promoCode={selectedPromoCode}
        />
      )}

      {/* Toggle Confirm Dialog */}
      <ConfirmDialog
        isOpen={toggleConfirm.show}
        onClose={() => setToggleConfirm({ show: false, promoCode: null })}
        onConfirm={() =>
          toggleConfirm.promoCode && handleToggleStatus(toggleConfirm.promoCode)
        }
        title={`${toggleConfirm.promoCode?.isActive ? 'Deactivate' : 'Activate'} Promo Code`}
        message={`Are you sure you want to ${
          toggleConfirm.promoCode?.isActive ? 'deactivate' : 'activate'
        } the promo code "${toggleConfirm.promoCode?.code}"?`}
        confirmText={toggleConfirm.promoCode?.isActive ? 'Deactivate' : 'Activate'}
        variant={toggleConfirm.promoCode?.isActive ? 'warning' : 'info'}
      />
    </div>
  );
};

const PromoCodeCard: React.FC<{
  promoCode: PromoCode;
  onToggle: (promoCode: PromoCode) => void;
  onViewUsage: (promoCode: PromoCode) => void;
}> = ({ promoCode, onToggle, onViewUsage }) => {
  const now = new Date();
  const validUntil = promoCode.validUntil.toDate();
  const isExpired = now > validUntil;
  const usagePercentage = promoCode.usageLimit
    ? (promoCode.usageCount / promoCode.usageLimit) * 100
    : 0;

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold font-mono">{promoCode.code}</h3>
            <Badge variant={promoCode.isActive && !isExpired ? 'success' : 'default'}>
              {isExpired ? 'Expired' : promoCode.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="info">{formatPercentage(promoCode.discountPercentage)} OFF</Badge>
          </div>

          {promoCode.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {promoCode.description}
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Valid From</p>
              <p className="font-medium">
                {formatDate(promoCode.validFrom.toDate(), 'PP')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Valid Until</p>
              <p className="font-medium">
                {formatDate(promoCode.validUntil.toDate(), 'PP')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Usage</p>
              <p className="font-medium">
                {promoCode.usageCount}
                {promoCode.usageLimit !== null && ` / ${promoCode.usageLimit}`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Applicable Plans</p>
              <p className="font-medium capitalize">
                {promoCode.applicablePlans.length > 0
                  ? promoCode.applicablePlans.join(', ')
                  : 'All Plans'}
              </p>
            </div>
          </div>

          {promoCode.usageLimit !== null && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Usage Progress</span>
                <span>{Math.round(usagePercentage)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usagePercentage >= 100
                      ? 'bg-destructive'
                      : usagePercentage >= 80
                      ? 'bg-yellow-500'
                      : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewUsage(promoCode)}
            title="View Usage"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(promoCode)}
            title={promoCode.isActive ? 'Deactivate' : 'Activate'}
          >
            {promoCode.isActive ? (
              <ToggleRight className="h-4 w-4 text-green-600" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};