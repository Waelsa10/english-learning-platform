import { initializePaddle, Paddle } from '@paddle/paddle-js';
import { PADDLE_CONFIG, isPaddleConfigured } from './config';

let paddleInstance: Paddle | null = null;

export const initPaddle = async (): Promise<Paddle | null> => {
  if (paddleInstance) return paddleInstance;

  // Check if Paddle is configured
  if (!isPaddleConfigured()) {
    console.warn('⚠️ Paddle not configured. Missing token or price IDs.');
    return null;
  }

  try {
    console.log('🚀 Initializing Paddle with environment:', PADDLE_CONFIG.environment);
    
    paddleInstance = await initializePaddle({
      environment: PADDLE_CONFIG.environment,
      token: PADDLE_CONFIG.token,
      eventCallback: (event) => {
        console.log('[Paddle Event]:', event);
      },
    });
    
    console.log('✅ Paddle initialized successfully');
    return paddleInstance;
  } catch (error) {
    console.error('❌ Failed to initialize Paddle:', error);
    return null;
  }
};

export const getPaddle = (): Paddle | null => paddleInstance;