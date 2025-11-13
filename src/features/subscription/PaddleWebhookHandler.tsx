import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface PaddleWebhookEvent {
  event_type: string;
  data: {
    id: string;
    customer_id: string;
    transaction_id: string;
    subscription_id?: string;
    status: string;
    items: Array<{
      price: {
        id: string;
        description: string;
      };
    }>;
    custom_data?: {
      userId: string;
      plan: string;
      discountPercentage?: number;
    };
    details: {
      totals: {
        total: string;
        currency_code: string;
      };
    };
  };
}

export const handlePaddleWebhook = async (event: PaddleWebhookEvent) => {
  console.log('Paddle Webhook:', event);

  switch (event.event_type) {
    case 'transaction.completed':
      await handleTransactionCompleted(event);
      break;
    
    case 'transaction.payment_failed':
      await handlePaymentFailed(event);
      break;
    
    case 'subscription.created':
      await handleSubscriptionCreated(event);
      break;
    
    case 'subscription.updated':
      await handleSubscriptionUpdated(event);
      break;
    
    case 'subscription.canceled':
      await handleSubscriptionCanceled(event);
      break;
    
    default:
      console.log('Unhandled event type:', event.event_type);
  }
};

async function handleTransactionCompleted(event: PaddleWebhookEvent) {
  const { customer_id, transaction_id, custom_data, details } = event.data;
  
  if (!custom_data?.userId) {
    console.error('No userId in custom_data');
    return;
  }

  const userId = custom_data.userId;
  const plan = custom_data.plan || 'basic';
  
  // Update student subscription
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 1);

  await updateDoc(doc(db, 'students', userId), {
    'subscription.status': 'active',
    'subscription.plan': plan,
    'subscription.paddleCustomerId': customer_id,
    'subscription.paddleTransactionId': transaction_id,
    'subscription.currentPeriodStart': serverTimestamp(),
    'subscription.currentPeriodEnd': serverTimestamp(),
    'metadata.updatedAt': serverTimestamp(),
  });

  // Create payment history
  await setDoc(doc(db, 'payment_history', transaction_id), {
    userId,
    paddleTransactionId: transaction_id,
    amount: parseFloat(details.totals.total),
    currency: details.totals.currency_code,
    status: 'succeeded',
    description: `Subscription - ${plan}`,
    createdAt: serverTimestamp(),
  });

  // Create notification
  await setDoc(doc(db, 'notifications', `payment_${transaction_id}`), {
    recipientId: userId,
    type: 'subscription',
    title: 'Payment Successful',
    body: `Your ${plan} subscription is now active!`,
    read: false,
    createdAt: serverTimestamp(),
  });
}

async function handlePaymentFailed(event: PaddleWebhookEvent) {
  const { custom_data } = event.data;
  
  if (!custom_data?.userId) return;

  await updateDoc(doc(db, 'students', custom_data.userId), {
    'subscription.status': 'past_due',
    'metadata.updatedAt': serverTimestamp(),
  });

  await setDoc(doc(db, 'notifications', `payment_failed_${Date.now()}`), {
    recipientId: custom_data.userId,
    type: 'subscription',
    title: 'Payment Failed',
    body: 'Your payment failed. Please update your payment method.',
    read: false,
    actionUrl: '/settings/subscription',
    createdAt: serverTimestamp(),
  });
}

async function handleSubscriptionCreated(event: PaddleWebhookEvent) {
  const { subscription_id, customer_id, custom_data } = event.data;
  
  if (!custom_data?.userId) return;

  await updateDoc(doc(db, 'students', custom_data.userId), {
    'subscription.paddleSubscriptionId': subscription_id,
    'subscription.paddleCustomerId': customer_id,
    'metadata.updatedAt': serverTimestamp(),
  });
}

async function handleSubscriptionUpdated(event: PaddleWebhookEvent) {
  const { status, custom_data } = event.data;
  
  if (!custom_data?.userId) return;

  await updateDoc(doc(db, 'students', custom_data.userId), {
    'subscription.status': status.toLowerCase(),
    'metadata.updatedAt': serverTimestamp(),
  });
}

async function handleSubscriptionCanceled(event: PaddleWebhookEvent) {
  const { custom_data } = event.data;
  
  if (!custom_data?.userId) return;

  await updateDoc(doc(db, 'students', custom_data.userId), {
    'subscription.status': 'canceled',
    'subscription.cancelAtPeriodEnd': true,
    'metadata.updatedAt': serverTimestamp(),
  });
}