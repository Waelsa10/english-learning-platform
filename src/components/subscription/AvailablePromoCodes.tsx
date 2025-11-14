import React, { useEffect, useState } from 'react';
import { Tag, Copy, Check } from 'lucide-react';
import { getAllPromoCodes } from '@/lib/firebase/promoCodes';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import toast from 'react-hot-toast';
import type { PromoCode } from '@/types';

export const AvailablePromoCodes: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const codes = await getAllPromoCodes();
      const now = new Date();
      
      const activeCodes = codes.filter(code => {
        if (!code.validUntil) return code.isActive;
        
        const validUntil = code.validUntil?.toDate 
          ? code.validUntil.toDate() 
          : new Date(code.validUntil);
        
        return code.isActive && validUntil > now;
      });
      
      setPromoCodes(activeCodes.slice(0, 3));
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (promoCodes.length === 0) {
    return (
      <div className="text-center py-6">
        <Tag className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No promo codes available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {promoCodes.map((promo) => (
        <div 
          key={promo.id} 
          className="p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5 hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <span className="font-bold text-lg">{promo.code}</span>
            </div>
            <Badge variant="success">{promo.discountPercentage}% OFF</Badge>
          </div>
          
          {promo.description && (
            <p className="text-sm text-muted-foreground mb-3">{promo.description}</p>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Valid until {promo.validUntil?.toDate 
                ? promo.validUntil.toDate().toLocaleDateString()
                : new Date(promo.validUntil).toLocaleDateString()
              }
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy(promo.code)}
              leftIcon={copiedCode === promo.code ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            >
              {copiedCode === promo.code ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
      ))}
      
      <p className="text-xs text-center text-muted-foreground">
        Apply codes during checkout to get discounts!
      </p>
    </div>
  );
};