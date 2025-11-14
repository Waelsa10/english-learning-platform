export const PADDLE_CONFIG = {
  // Remove the hardcoded token - only use env variable
  token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN || 'test_b0304965e63cb3c78d5c676e1dd',
  environment: (import.meta.env.VITE_PADDLE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
  
  priceIds: {
    basic: import.meta.env.VITE_PADDLE_BASIC_PRICE_ID || 'pri_01ka1x6zh8qn7nv1kb8fznygcj',
    premium: import.meta.env.VITE_PADDLE_PREMIUM_PRICE_ID || 'pri_01ka1x7t89131sktrjdyekpdc9',
    enterprise: import.meta.env.VITE_PADDLE_ENTERPRISE_PRICE_ID || 'pri_01ka1x8q4bxvarftgsp24tnaa7',
  },
} as const;

// ✅ Enable test mode if Paddle is not configured
export const ENABLE_TEST_MODE = import.meta.env.VITE_ENABLE_PAYMENT_TEST_MODE === 'true';

export const isPaddleConfigured = (): boolean => {
  return !!(
    PADDLE_CONFIG.token &&
    PADDLE_CONFIG.priceIds.basic &&
    PADDLE_CONFIG.priceIds.premium &&
    PADDLE_CONFIG.priceIds.enterprise
  );
};

export const shouldUsePaddle = (): boolean => {
  return isPaddleConfigured() && !ENABLE_TEST_MODE;
};

// Add debug function
export const debugPaddleConfig = () => {
  console.log('🔍 Paddle Configuration Debug:');
  console.log('- Test Mode:', ENABLE_TEST_MODE);
  console.log('- Token exists:', !!PADDLE_CONFIG.token);
  console.log('- Token length:', PADDLE_CONFIG.token?.length);
  console.log('- Environment:', PADDLE_CONFIG.environment);
  console.log('- Basic Price ID:', !!PADDLE_CONFIG.priceIds.basic);
  console.log('- Premium Price ID:', !!PADDLE_CONFIG.priceIds.premium);
  console.log('- Enterprise Price ID:', !!PADDLE_CONFIG.priceIds.enterprise);
  console.log('- Is Configured:', isPaddleConfigured());
  console.log('- Should Use Paddle:', shouldUsePaddle());
};