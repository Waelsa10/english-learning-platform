import axios from 'axios';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const TAP_SECRET_KEY = process.env.TAP_SECRET_KEY!;
const TAP_API_URL = 'https://api.tap.company/v2';

interface TapCustomerParams {
  email: string;
  first_name: string;
  last_name: string;
  phone: {
    country_code: string;
    number: string;
  };
  metadata?: Record<string, string>;
}

interface TapChargeParams {
  amount: number;
  currency: string;
  customer_id: string;
  description: string;
  metadata?: Record<string, any>;
  redirect: {
    url: string;
  };
  source: {
    id: string;
  };
  post?: {
    url: string;
  };
}

interface TapSubscriptionParams {
  customer_id: string;
  amount: number;
  currency: string;
  interval: 'MONTHLY' | 'YEARLY';
  metadata?: Record<string, any>;
}

const tapRequest = async (method: string, endpoint: string, data?: any) => {
  try {
    const response = await axios({
      method,
      url: `${TAP_API_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${TAP_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      data,
    });
    return response.data;
  } catch (error: any) {
    console.error('Tap API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const createTapCustomer = async (params: TapCustomerParams): Promise<string> => {
  const response = await tapRequest('POST', '/customers', params);
  return response.id;
};

export const createCharge = async (params: TapChargeParams) => {
  const response = await tapRequest('POST', '/charges', params);
  return response;
};

export const createSubscription = async (params: TapSubscriptionParams) => {
  const chargeParams = {
    amount: params.amount,
    currency: params.currency,
    customer: {
      id: params.customer_id,
    },
    description: `Subscription - ${params.interval}`,
    metadata: params.metadata,
    redirect: {
      url: `${process.env.APP_URL}/subscription/success`,
    },
    post: {
      url: `${process.env.APP_URL}/api/tap-webhook`,
    },
    save_card: true,
    statement_descriptor: 'English Learning',
  };

  const charge = await tapRequest('POST', '/charges', chargeParams);

  // Create recurring charge
  if (charge.id && charge.card && charge.card.id) {
    const recurringParams = {
      customer_id: params.customer_id,
      card_id: charge.card.id,
      amount: params.amount,
      currency: params.currency,
      interval: params.interval,
      metadata: params.metadata,
    };

    // Store recurring payment info in Firestore
    await admin.firestore().collection('recurring_payments').add({
      customerId: params.customer_id,
      cardId: charge.card.id,
      amount: params.amount,
      currency: params.currency,
      interval: params.interval,
      status: 'active',
      nextPaymentDate: getNextPaymentDate(params.interval),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return charge;
};

export const cancelSubscription = async (customerId: string) => {
  const recurringPayments = await admin.firestore()
    .collection('recurring_payments')
    .where('customerId', '==', customerId)
    .where('status', '==', 'active')
    .get();

  const updates = recurringPayments.docs.map(doc => 
    doc.ref.update({
      status: 'canceled',
      canceledAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  );

  await Promise.all(updates);
};

export const handleTapWebhook = async (
  req: functions.https.Request,
  res: functions.Response
): Promise<void> => {
  const event = req.body;

  console.log('Tap Webhook Event:', event);

  try {
    switch (event.object) {
      case 'charge':
        if (event.status === 'CAPTURED') {
          await handleChargeSuccess(event);
        } else if (event.status === 'FAILED') {
          await handleChargeFailed(event);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.object}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send('Webhook Error');
  }
};

async function handleChargeSuccess(charge: any): Promise<void> {
  const customerId = charge.customer?.id;
  if (!customerId) return;

  // Find student by Tap customer ID
  const studentsQuery = await admin.firestore()
    .collection('students')
    .where('subscription.tapCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (studentsQuery.empty) {
    console.error('Student not found for customer:', customerId);
    return;
  }

  const studentDoc = studentsQuery.docs[0];

  // Determine subscription period based on amount
  const amount = charge.amount;
  let plan = 'basic';
  let months = 1;

  if (amount >= 99) {
    plan = 'enterprise';
  } else if (amount >= 49) {
    plan = 'premium';
  }

  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + months);

  // Update subscription
  await studentDoc.ref.update({
    'subscription.status': 'active',
    'subscription.plan': plan,
    'subscription.currentPeriodStart': admin.firestore.Timestamp.fromDate(now),
    'subscription.currentPeriodEnd': admin.firestore.Timestamp.fromDate(endDate),
    'subscription.tapChargeId': charge.id,
    'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
  });

  // Create payment history
  await admin.firestore().collection('payment_history').add({
    customerId,
    tapChargeId: charge.id,
    amount: charge.amount,
    currency: charge.currency,
    status: 'succeeded',
    description: `Subscription payment - ${plan}`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    receiptUrl: charge.receipt?.url,
  });
}

async function handleChargeFailed(charge: any): Promise<void> {
  const customerId = charge.customer?.id;
  if (!customerId) return;

  const studentsQuery = await admin.firestore()
    .collection('students')
    .where('subscription.tapCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (studentsQuery.empty) return;

  const studentDoc = studentsQuery.docs[0];
  const student = studentDoc.data();

  // Update subscription status
  await studentDoc.ref.update({
    'subscription.status': 'past_due',
    'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
  });

  // Create notification
  await admin.firestore().collection('notifications').add({
    recipientId: studentDoc.id,
    type: 'subscription',
    title: 'Payment Failed',
    body: 'Your subscription payment failed. Please update your payment method.',
    read: false,
    actionUrl: '/settings/subscription',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

function getNextPaymentDate(interval: 'MONTHLY' | 'YEARLY'): admin.firestore.Timestamp {
  const now = new Date();
  if (interval === 'MONTHLY') {
    now.setMonth(now.getMonth() + 1);
  } else {
    now.setFullYear(now.getFullYear() + 1);
  }
  return admin.firestore.Timestamp.fromDate(now);
}

// Helper to get customer by ID
export const getTapCustomer = async (customerId: string) => {
  return await tapRequest('GET', `/customers/${customerId}`);
};

// Helper to get charge by ID
export const getTapCharge = async (chargeId: string) => {
  return await tapRequest('GET', `/charges/${chargeId}`);
};