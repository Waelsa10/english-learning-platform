import { initializePaddle, Paddle } from '@paddle/paddle-js';

let paddleInstance: Paddle | undefined;

export const getPaddle = async (): Promise<Paddle | undefined> => {
  if (paddleInstance) return paddleInstance;

  const vendorId = import.meta.env.VITE_PADDLE_VENDOR_ID;
  const environment = import.meta.env.VITE_PADDLE_ENVIRONMENT || 'sandbox';

  paddleInstance = await initializePaddle({
    token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
    environment: environment as 'sandbox' | 'production',
  });

  return paddleInstance;
};

export interface PaddleCheckoutOptions {
  items: Array<{
    priceId: string;
    quantity: number;
  }>;
  customData?: {
    userId: string;
    plan: string;
    discountPercentage?: number;
  };
  customer?: {
    email: string;
  };
}

export const openPaddleCheckout = async (
  options: PaddleCheckoutOptions
): Promise<void> => {
  const paddle = await getPaddle();
  
  if (!paddle) {
    throw new Error('Paddle failed to initialize');
  }

  paddle.Checkout.open({
    items: options.items,
    customData: options.customData,
    customer: options.customer,
    settings: {
      displayMode: 'overlay',
      theme: 'light',
      locale: 'en',
    },
  });
};

export const closePaddleCheckout = async (): Promise<void> => {
  const paddle = await getPaddle();
  paddle?.Checkout.close();
};

// Paddle Product Price IDs (You'll create these in Paddle Dashboard)
export const PADDLE_PRICES = {
  basic_monthly: 'live_e28ada2bc9e7868c9df32c808fd',      // Replace with actual Paddle price ID
  premium_monthly: 'live_e28ada2bc9e7868c9df32c808fd',  // Replace with actual Paddle price ID
  enterprise_monthly: 'live_e28ada2bc9e7868c9df32c808fd', // Replace with actual Paddle price ID
};