import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ApplyPromoCode } from './ApplyPromoCode';
import { formatCurrency } from '@/utils/formatters';
import { openPaddleCheckout, PADDLE_PRICES } from '@/lib/paddle';
import toast from 'react-hot-toast';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    currency: 'USD',
    paddlePriceId: PADDLE_PRICES.basic_monthly,
    features: [
      '1 Teacher Assignment',
      '10 Assignments per month',
      'Basic Progress Tracking',
      'Email Support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 49,
    currency: 'USD',
    paddlePriceId: PADDLE_PRICES.premium_monthly,
    popular: true,
    features: [
      'Everything in Basic',
      'Unlimited Assignments',
      'Advanced Analytics',
      'Priority Support',
      'Live Sessions (2/month)',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    currency: 'USD',
    paddlePriceId: PADDLE_PRICES.enterprise_monthly,
    features: [
      'Everything in Premium',
      'Multiple Teachers',
      'Custom Curriculum',
      '24/7 Support',
      'Unlimited Live Sessions',
      'Certificate Program',
    ],
  },
];

export const SubscriptionPlans: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);
  const originalPrice = selectedPlanData?.price || 0;
  const discountAmount = (originalPrice * discountPercentage) / 100;
  const finalPrice = originalPrice - discountAmount;

  const handleSubscribe = async () => {
    if (!user || !selectedPlanData) return;

    setIsProcessing(true);
    
    try {
      await openPaddleCheckout({
        items: [
          {
            priceId: selectedPlanData.paddlePriceId,
            quantity: 1,
          },
        ],
        customData: {
          userId: user.uid,
          plan: selectedPlan,
          discountPercentage,
        },
        customer: {
          email: user.email,
        },
      });

      toast.success('Checkout opened! Complete your payment.');
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to open checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${
              selectedPlan === plan.id ? 'ring-2 ring-primary' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="info">Most Popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-center">
                <p className="text-2xl font-bold">{plan.name}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={selectedPlan === plan.id ? 'primary' : 'outline'}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Promo Code Section */}
      <Card>
        <CardHeader>
          <CardTitle>Have a Promo Code?</CardTitle>
        </CardHeader>
        <CardContent>
          <ApplyPromoCode
            selectedPlan={selectedPlan}
            onPromoCodeApplied={setDiscountPercentage}
          />
        </CardContent>
      </Card>

      {/* Price Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-medium capitalize">{selectedPlan}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Original Price</span>
            <span className="font-medium">{formatCurrency(originalPrice)}</span>
          </div>
          {discountPercentage > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({discountPercentage}%)</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className="border-t pt-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(finalPrice)}/month</span>
            </div>
          </div>
          
          {/* Payment Methods */}
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground mb-3">We accept:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">💳 Credit Card</Badge>
              <Badge variant="outline">🍎 Apple Pay</Badge>
              <Badge variant="outline">📱 Google Pay</Badge>
              <Badge variant="outline">💰 PayPal</Badge>
            </div>
          </div>

          <Button 
            className="w-full" 
            size="lg"
            onClick={handleSubscribe}
            isLoading={isProcessing}
          >
            Subscribe Now
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Secured by Paddle • 14-day money-back guarantee • Cancel anytime
          </p>
        </CardContent>
      </Card>
    </div>
  );
};