export const trackPromoCodeEvent = (eventName: string, data: Record<string, any>) => {
  // Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, data);
  }

  // Console log for development
  console.log('Analytics Event:', eventName, data);
};

// Promo code specific events
export const trackPromoCodeApplied = (data: {
  code: string;
  discount: number;
  plan: string;
  userId: string;
}) => {
  trackPromoCodeEvent('promo_code_applied', data);
};

export const trackPromoCodeValidationFailed = (data: {
  code: string;
  error: string;
  userId: string;
}) => {
  trackPromoCodeEvent('promo_code_validation_failed', data);
};

export const trackPromoCodeCreated = (data: {
  code: string;
  discount: number;
  createdBy: string;
}) => {
  trackPromoCodeEvent('promo_code_created', data);
};