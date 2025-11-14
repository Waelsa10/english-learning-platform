import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Eye, Tag } from 'lucide-react';
import { 
  getAllPromoCodes, 
  createPromoCode, 
  updatePromoCode, 
  deletePromoCode,
  getPromoCodeUsage 
} from '@/lib/firebase/promoCodes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { PageSpinner } from '@/components/common/Spinner';
import { useAuthStore } from '@/store/authStore';
import { serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import type { PromoCode, PromoCodeUsage } from '@/types';

export const PromoCodesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | null>(null);
  const [usageData, setUsageData] = useState<PromoCodeUsage[]>([]);
  const [showUsageDialog, setShowUsageDialog] = useState(false);

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    setIsLoading(true);
    try {
      const codes = await getAllPromoCodes();
      setPromoCodes(codes);
    } catch (error) {
      toast.error('Failed to load promo codes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewUsage = async (promoCode: PromoCode) => {
    try {
      const usage = await getPromoCodeUsage(promoCode.id);
      setUsageData(usage);
      setSelectedPromo(promoCode);
      setShowUsageDialog(true);
    } catch (error) {
      toast.error('Failed to load usage data');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this promo code?')) return;
    
    try {
      await deletePromoCode(id);
      toast.success('Promo code deactivated');
      fetchPromoCodes();
    } catch (error) {
      toast.error('Failed to deactivate promo code');
    }
  };

  if (isLoading) {
    return <PageSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promo Codes</h1>
          <p className="text-muted-foreground mt-1">
            Manage discount codes for subscriptions
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} leftIcon={<Plus className="h-4 w-4" />}>
          Create Promo Code
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold">{promoCodes.length}</p>
            <p className="text-sm text-muted-foreground">Total Codes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold text-green-600">
              {promoCodes.filter(p => p.isActive).length}
            </p>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold text-red-600">
              {promoCodes.filter(p => !p.isActive).length}
            </p>
            <p className="text-sm text-muted-foreground">Inactive</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold">
              {promoCodes.reduce((acc, p) => acc + p.usageCount, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Uses</p>
          </CardContent>
        </Card>
      </div>

      {/* Promo Codes List */}
      <Card>
        <CardContent className="p-0">
          {promoCodes.length > 0 ? (
            <div className="divide-y">
              {promoCodes.map((promo) => (
                <div key={promo.id} className="p-6 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Tag className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{promo.code}</h3>
                          {promo.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                          <Badge variant="default">{promo.discountPercentage}% OFF</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{promo.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Used: {promo.usageCount}/{promo.usageLimit || '∞'}</span>
                          <span>
                            Valid until: {promo.validUntil?.toDate 
                              ? promo.validUntil.toDate().toLocaleDateString()
                              : new Date(promo.validUntil).toLocaleDateString()
                            }
                          </span>
                          {promo.applicablePlans?.length > 0 && (
                            <span>Plans: {promo.applicablePlans.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewUsage(promo)}
                        leftIcon={<Eye className="h-4 w-4" />}
                      >
                        Usage
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(promo.id)}
                        leftIcon={<Trash2 className="h-4 w-4" />}
                      >
                        Deactivate
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No promo codes yet</p>
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                Create First Promo Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      {showCreateDialog && (
        <CreatePromoCodeDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            fetchPromoCodes();
          }}
        />
      )}

      {/* Usage Dialog */}
      {showUsageDialog && selectedPromo && (
        <UsageDialog
          promoCode={selectedPromo}
          usageData={usageData}
          onClose={() => setShowUsageDialog(false)}
        />
      )}
    </div>
  );
};

const CreatePromoCodeDialog: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountPercentage: 10,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: '',
    applicablePlans: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      await createPromoCode({
        code: formData.code.toUpperCase(),
        description: formData.description,
        discountPercentage: formData.discountPercentage,
        discountType: 'percentage',
        isActive: true,
        validFrom: new Date(formData.validFrom) as any,
        validUntil: new Date(formData.validUntil) as any,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        applicablePlans: formData.applicablePlans as any,
        createdBy: user.uid,
      });

      toast.success('Promo code created successfully!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create promo code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Create Promo Code</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SAVE20"
                required
              />
              <Input
                label="Discount %"
                type="number"
                min="1"
                max="100"
                value={formData.discountPercentage}
                onChange={(e) => setFormData({ ...formData, discountPercentage: parseInt(e.target.value) })}
                required
              />
            </div>

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Special discount for new users"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Valid From"
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                required
              />
              <Input
                label="Valid Until"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                required
              />
            </div>

            <Input
              label="Usage Limit (leave empty for unlimited)"
              type="number"
              min="1"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
              placeholder="100"
            />

            <div>
              <label className="block text-sm font-medium mb-2">Applicable Plans</label>
              <div className="space-y-2">
                {['basic', 'premium', 'enterprise'].map((plan) => (
                  <label key={plan} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.applicablePlans.includes(plan)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            applicablePlans: [...formData.applicablePlans, plan],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            applicablePlans: formData.applicablePlans.filter((p) => p !== plan),
                          });
                        }
                      }}
                    />
                    <span className="capitalize">{plan}</span>
                  </label>
                ))}
                <p className="text-xs text-muted-foreground">Leave all unchecked for all plans</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" isLoading={isLoading} className="flex-1">
                Create Promo Code
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const UsageDialog: React.FC<{
  promoCode: PromoCode;
  usageData: PromoCodeUsage[];
  onClose: () => void;
}> = ({ promoCode, usageData, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Usage History - {promoCode.code}</CardTitle>
            <button onClick={onClose} className="text-2xl leading-none">×</button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          {usageData.length > 0 ? (
            <div className="space-y-3">
              {usageData.map((usage) => (
                <div key={usage.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{usage.userName}</p>
                      <p className="text-sm text-muted-foreground">{usage.userEmail}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Plan: <span className="capitalize">{usage.plan}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="success">{usage.discountPercentage}% OFF</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {usage.appliedAt?.toDate 
                          ? usage.appliedAt.toDate().toLocaleString()
                          : new Date(usage.appliedAt).toLocaleString()
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No usage data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};