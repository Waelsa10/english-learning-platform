import React, { useState, useEffect } from 'react';
import { Check, CreditCard, AlertCircle, Shield, XCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ApplyPromoCode } from './ApplyPromoCode';
import { formatCurrency } from '@/utils/formatters';
import { updateDocument } from '@/lib/firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { initPaddle } from '@/lib/paddle/paddleService';
import { PADDLE_CONFIG, shouldUsePaddle, ENABLE_TEST_MODE, isPaddleConfigured } from '@/lib/paddle/config';
import type { Paddle, CheckoutEventsData } from '@paddle/paddle-js';
import toast from 'react-hot-toast';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    currency: 'USD',
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

interface SubscriptionPlansProps {
  onComplete?: () => void;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onComplete }) => {
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [paddleStatus, setPaddleStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [paddleError, setPaddleError] = useState<string | null>(null);
  const [fallbackToTest, setFallbackToTest] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const setupPaddle = async () => {
      // Skip if test mode is enabled
      if (ENABLE_TEST_MODE) {
        setPaddleStatus('idle');
        return;
      }

      // Skip if we should not use Paddle
      if (!shouldUsePaddle()) {
        setPaddleStatus('idle');
        setFallbackToTest(true);
        return;
      }

      setPaddleStatus('loading');
      setPaddleError(null);

      // Set a timeout of 10 seconds for Paddle to initialize
      timeoutId = setTimeout(() => {
        if (paddleStatus === 'loading') {
          console.error('⏱️ Paddle initialization timeout');
          setPaddleStatus('error');
          setPaddleError('Payment system took too long to load. You can still use test mode.');
          setFallbackToTest(true);
        }
      }, 10000);

      // Check if Paddle is configured
      if (!isPaddleConfigured()) {
        console.warn('⚠️ Paddle not fully configured');
        setPaddleStatus('error');
        setPaddleError('Payment system not configured. Using test mode.');
        setFallbackToTest(true);
        clearTimeout(timeoutId);
        return;
      }

      try {
        console.log('🚀 Initializing Paddle...');
        const paddleInstance = await initPaddle();
        
        if (paddleInstance) {
          setPaddle(paddleInstance);
          setPaddleStatus('ready');
          console.log('✅ Paddle ready');
        } else {
          setPaddleStatus('error');
          setPaddleError('Failed to initialize payment system');
          setFallbackToTest(true);
          console.error('❌ Paddle initialization returned null');
        }
      } catch (error) {
        console.error('❌ Paddle setup error:', error);
        setPaddleStatus('error');
        setPaddleError('Payment system unavailable');
        setFallbackToTest(true);
      } finally {
        clearTimeout(timeoutId);
      }
    };
    
    setupPaddle();

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);
  const originalPrice = selectedPlanData?.price || 0;
  const discountAmount = (originalPrice * discountPercentage) / 100;
  const finalPrice = originalPrice - discountAmount;

  const handleSubscribe = async () => {
  if (!user || !selectedPlanData) {
    toast.error('Please log in to subscribe');
    return;
  }

  const userId = user.id || user.uid;
  
  if (!userId) {
    console.error('No user ID found:', user);
    toast.error('Unable to process subscription: User ID not found');
    return;
  }

  setIsProcessing(true);
  
  try {
    // TEST MODE or FALLBACK
    if (ENABLE_TEST_MODE || fallbackToTest || paddleStatus === 'error') {
      // ... existing test mode code ...
      return;
    }

    // PRODUCTION MODE: Use Paddle
    if (!paddle || paddleStatus !== 'ready') {
      toast.error('Payment system is not ready. Please try again or use test mode.');
      setIsProcessing(false);
      return;
    }

    const priceId = PADDLE_CONFIG.priceIds[selectedPlan as keyof typeof PADDLE_CONFIG.priceIds];
    
    // ✅ DETAILED DEBUG LOGGING
    console.log('═══════════════════════════════════');
    console.log('🔍 CHECKOUT DEBUG:');
    console.log('═══════════════════════════════════');
    console.log('Selected Plan:', selectedPlan);
    console.log('Price ID:', priceId);
    console.log('Price ID Type:', typeof priceId);
    console.log('Starts with pri_?', priceId?.startsWith('pri_'));
    console.log('Environment:', PADDLE_CONFIG.environment);
    console.log('Token (first 20 chars):', PADDLE_CONFIG.token?.substring(0, 20) + '...');
    console.log('User Email:', user.email);
    console.log('═══════════════════════════════════');
    
    if (!priceId) {
      toast.error('Invalid plan configuration');
      console.error('❌ Missing price ID for plan:', selectedPlan);
      setIsProcessing(false);
      return;
    }

    if (!priceId.startsWith('pri_')) {
      console.error('❌ INVALID PRICE ID! Expected pri_xxx but got:', priceId);
      toast.error('Configuration error: Invalid price ID format');
      setIsProcessing(false);
      return;
    }

    // Open Paddle Checkout
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: user.email ? { email: user.email } : undefined,
      customData: {
        userId,
        planId: selectedPlan,
        discountPercentage: discountPercentage.toString(),
      },
      settings: {
        displayMode: 'overlay',
        theme: 'light',
        locale: 'en',
        allowLogout: false,
        successUrl: `${window.location.origin}/dashboard?payment=success`,
      },
      eventCallback: async (event: CheckoutEventsData) => {
        console.log('🔔 Paddle Event:', event.name, event);
        
        // ✅ LOG ERROR DETAILS
        if (event.name === 'checkout.error') {
          console.error('❌ PADDLE CHECKOUT ERROR:');
          console.error('Error data:', event.data);
          console.error('Error code:', event.code);
          console.error('Error detail:', event.detail);
          console.error('Documentation:', event.documentation_url);
          toast.error(event.detail || 'Checkout error occurred');
          setIsProcessing(false);
          return;
        }
        
        if (event.name === 'checkout.completed') {
          try {
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
            
            await updateDocument('users', userId, {
              'subscription.plan': selectedPlan,
              'subscription.status': 'active',
              'subscription.startDate': serverTimestamp(),
              'subscription.endDate': endDate,
              'subscription.amount': finalPrice,
              'subscription.currency': 'USD',
              'subscription.discountPercentage': discountPercentage,
              'subscription.paddleSubscriptionId': event.data?.subscription_id,
              'subscription.paddleCustomerId': event.data?.customer?.id,
            });
            
            toast.success('🎉 Subscription activated!');
            
            setTimeout(() => {
              if (onComplete) onComplete();
              else window.location.href = '/dashboard';
            }, 2000);
          } catch (error) {
            console.error('Error updating subscription:', error);
            toast.error('Payment successful but activation failed. Contact support.');
          }
        }
        
        if (event.name === 'checkout.closed') {
          console.log('Checkout closed by user');
          setIsProcessing(false);
        }
      },
    });
    
  } catch (error: any) {
    console.error('❌ Subscription error:', error);
    toast.error('Failed to process subscription');
    setIsProcessing(false);
  }
};

  // Determine button state and text
  const getButtonState = () => {
    if (isProcessing) {
      return { text: 'Processing...', disabled: true };
    }
    
    if (ENABLE_TEST_MODE || fallbackToTest) {
      return { text: '🧪 Activate Test Subscription', disabled: false };
    }
    
    if (paddleStatus === 'loading') {
      return { text: 'Loading Payment System...', disabled: true };
    }
    
    if (paddleStatus === 'error') {
      return { text: '🧪 Use Test Mode (Payment System Unavailable)', disabled: false };
    }
    
    if (paddleStatus === 'ready') {
      return { text: `Pay ${formatCurrency(finalPrice)}/month`, disabled: false };
    }
    
    return { text: 'Subscribe Now', disabled: true };
  };

  const buttonState = getButtonState();

  return (
    <div className="space-y-8">
      {/* Status Messages */}
      {paddleStatus === 'loading' && !ENABLE_TEST_MODE && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-transparent" />
            <p className="text-sm text-gray-800 dark:text-gray-200">
              Initializing secure payment system...
            </p>
          </div>
        </div>
      )}

      {paddleStatus === 'error' && !ENABLE_TEST_MODE && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                {paddleError || 'Payment system unavailable'}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                You can still subscribe using test mode (no payment required).
              </p>
            </div>
          </div>
        </div>
      )}

      {paddleStatus === 'ready' && PADDLE_CONFIG.environment === 'sandbox' && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                Sandbox Mode - Test Card: 4242 4242 4242 4242
              </p>
            </div>
          </div>
        </div>
      )}

      {(ENABLE_TEST_MODE || fallbackToTest) && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Test Mode:</strong> No payment required. Subscription will activate instantly.
            </p>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative cursor-pointer transition-all ${
              selectedPlan === plan.id ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="default">Most Popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-center">
                <p className="text-2xl font-bold">{plan.name}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                <div className={`w-full py-2 px-4 rounded-lg text-center font-medium ${
                  selectedPlan === plan.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-accent'
                }`}>
                  {selectedPlan === plan.id ? '✓ Selected' : 'Select Plan'}
                </div>
              </div>
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
            <span className={discountPercentage > 0 ? 'line-through text-muted-foreground' : 'font-medium'}>
              {formatCurrency(originalPrice)}
            </span>
          </div>
          {discountPercentage > 0 && (
            <>
              <div className="flex justify-between text-green-600">
                <span>Discount ({discountPercentage}%)</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-green-600">
                <span>Final Price</span>
                <span>{formatCurrency(finalPrice)}/month</span>
              </div>
            </>
          )}
          <div className="border-t pt-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(finalPrice)}/month</span>
            </div>
          </div>
          
          <div className="pt-3 border-t">
            <div className="flex items-center justify-center gap-2 mb-3">
              {paddleStatus === 'ready' && <Shield className="h-4 w-4 text-green-600" />}
              {paddleStatus === 'error' && <XCircle className="h-4 w-4 text-yellow-600" />}
              <p className="text-sm text-muted-foreground">
                {paddleStatus === 'ready' ? '🔒 Secure Payment via Paddle' :
                 paddleStatus === 'loading' ? '⏳ Loading Payment System...' :
                 paddleStatus === 'error' ? '⚠️ Using Test Mode' :
                 '🧪 Test Mode Active'}
              </p>
            </div>
          </div>

          <Button 
            className="w-full" 
            size="lg"
            onClick={handleSubscribe}
            isLoading={isProcessing}
            disabled={buttonState.disabled}
            leftIcon={<CreditCard className="h-5 w-5" />}
          >
            {buttonState.text}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            {paddleStatus === 'ready' 
              ? 'Secured Payment • 14-day money-back guarantee • Cancel anytime'
              : 'Test mode: Subscription will activate without payment'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
};