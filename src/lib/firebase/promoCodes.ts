import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { PromoCode, PromoCodeUsage } from '@/types';

/**
 * Create a new promo code
 */
export const createPromoCode = async (
  promoCode: Omit<PromoCode, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>
): Promise<string> => {
  try {
    const codeUpper = promoCode.code.toUpperCase().trim();
    
    // Validate code format (alphanumeric and dashes only)
    if (!/^[A-Z0-9-]+$/.test(codeUpper)) {
      throw new Error('Promo code can only contain letters, numbers, and dashes');
    }

    const promoCodeRef = doc(db, 'promo_codes', codeUpper);
    
    // Check if code already exists
    const existing = await getDoc(promoCodeRef);
    if (existing.exists()) {
      throw new Error('Promo code already exists');
    }

    await setDoc(promoCodeRef, {
      ...promoCode,
      code: codeUpper,
      usageCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return promoCodeRef.id;
  } catch (error) {
    console.error('Error creating promo code:', error);
    throw error;
  }
};

/**
 * Get a single promo code by code
 */
export const getPromoCodeByCode = async (
  code: string
): Promise<PromoCode | null> => {
  try {
    const docRef = doc(db, 'promo_codes', code.toUpperCase().trim());
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return { id: docSnap.id, ...docSnap.data() } as PromoCode;
  } catch (error) {
    console.error('Error getting promo code:', error);
    return null;
  }
};

/**
 * Get a promo code by document ID
 */
export const getPromoCodeById = async (
  id: string
): Promise<PromoCode | null> => {
  try {
    const docRef = doc(db, 'promo_codes', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return { id: docSnap.id, ...docSnap.data() } as PromoCode;
  } catch (error) {
    console.error('Error getting promo code by ID:', error);
    return null;
  }
};

/**
 * Get all promo codes (optionally filter by active status)
 */
export const getAllPromoCodes = async (
  activeOnly: boolean = false
): Promise<PromoCode[]> => {
  try {
    let q;
    
    if (activeOnly) {
      q = query(
        collection(db, 'promo_codes'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'promo_codes'),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PromoCode[];
  } catch (error) {
    console.error('Error getting promo codes:', error);
    return [];
  }
};

/**
 * Get all active and valid promo codes (not expired)
 */
export const getActivePromoCodes = async (): Promise<PromoCode[]> => {
  try {
    const codes = await getAllPromoCodes(true);
    const now = new Date();
    
    return codes.filter(code => {
      if (!code.validUntil) return true;
      
      const validUntil = code.validUntil?.toDate 
        ? code.validUntil.toDate() 
        : new Date(code.validUntil);
      
      // Check if not expired and not at usage limit
      const notExpired = validUntil > now;
      const hasUsageLeft = code.usageLimit === null || code.usageCount < code.usageLimit;
      
      return notExpired && hasUsageLeft;
    });
  } catch (error) {
    console.error('Error getting active promo codes:', error);
    return [];
  }
};

/**
 * Validate a promo code for a specific user and plan
 */
export const validatePromoCode = async (
  code: string,
  userId: string,
  plan: string
): Promise<{ valid: boolean; error?: string; promoCode?: PromoCode }> => {
  try {
    const promoCode = await getPromoCodeByCode(code);

    if (!promoCode) {
      return { valid: false, error: 'Promo code not found' };
    }

    if (!promoCode.isActive) {
      return { valid: false, error: 'This promo code is no longer active' };
    }

    const now = new Date();
    
    // Check valid from date
    if (promoCode.validFrom) {
      const validFrom = promoCode.validFrom.toDate 
        ? promoCode.validFrom.toDate() 
        : new Date(promoCode.validFrom);

      if (now < validFrom) {
        return { 
          valid: false, 
          error: `Promo code will be valid from ${validFrom.toLocaleDateString()}` 
        };
      }
    }

    // Check expiration
    if (promoCode.validUntil) {
      const validUntil = promoCode.validUntil.toDate 
        ? promoCode.validUntil.toDate() 
        : new Date(promoCode.validUntil);

      if (now > validUntil) {
        return { valid: false, error: 'This promo code has expired' };
      }
    }

    // Check usage limit
    if (
      promoCode.usageLimit !== null &&
      promoCode.usageLimit !== undefined &&
      promoCode.usageCount >= promoCode.usageLimit
    ) {
      return { valid: false, error: 'This promo code has reached its usage limit' };
    }

    // Check if user already used this promo code
    const usageQuery = query(
      collection(db, 'promo_code_usage'),
      where('userId', '==', userId),
      where('promoCode', '==', code.toUpperCase())
    );
    const usageSnapshot = await getDocs(usageQuery);

    if (!usageSnapshot.empty) {
      return { valid: false, error: 'You have already used this promo code' };
    }

    // Check if promo code is applicable to the selected plan
    if (
      promoCode.applicablePlans &&
      promoCode.applicablePlans.length > 0 &&
      !promoCode.applicablePlans.includes(plan as any)
    ) {
      const plans = promoCode.applicablePlans
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(', ');
      return { 
        valid: false, 
        error: `This code is only valid for: ${plans}` 
      };
    }

    return { valid: true, promoCode };
  } catch (error) {
    console.error('Error validating promo code:', error);
    return { valid: false, error: 'Error validating promo code. Please try again.' };
  }
};

/**
 * Apply a promo code to a user
 */
export const applyPromoCode = async (
  promoCodeId: string,
  userId: string,
  userName: string,
  userEmail: string,
  promoCode: string,
  discountPercentage: number,
  plan: string
): Promise<void> => {
  try {
    const batch = [];

    // Create usage record
    const usageRef = doc(collection(db, 'promo_code_usage'));
    batch.push(
      setDoc(usageRef, {
        promoCodeId,
        promoCode: promoCode.toUpperCase(),
        userId,
        userName,
        userEmail,
        discountPercentage,
        plan,
        appliedAt: serverTimestamp(),
      })
    );

    // Increment usage count
    const promoCodeRef = doc(db, 'promo_codes', promoCodeId);
    batch.push(
      updateDoc(promoCodeRef, {
        usageCount: increment(1),
        updatedAt: serverTimestamp(),
      })
    );

    // Update user document
    batch.push(
      updateDoc(doc(db, 'users', userId), {
        'subscription.appliedPromoCode': {
          code: promoCode.toUpperCase(),
          discountPercentage,
          appliedAt: serverTimestamp(),
        },
      })
    );

    // Execute all updates
    await Promise.all(batch);
  } catch (error) {
    console.error('Error applying promo code:', error);
    throw error;
  }
};

/**
 * Update a promo code
 */
export const updatePromoCode = async (
  id: string,
  updates: Partial<PromoCode>
): Promise<void> => {
  try {
    const promoCodeRef = doc(db, 'promo_codes', id);
    
    // If updating the code, validate format
    if (updates.code) {
      const codeUpper = updates.code.toUpperCase().trim();
      if (!/^[A-Z0-9-]+$/.test(codeUpper)) {
        throw new Error('Promo code can only contain letters, numbers, and dashes');
      }
      updates.code = codeUpper;
    }

    await updateDoc(promoCodeRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating promo code:', error);
    throw error;
  }
};

/**
 * Soft delete a promo code (deactivate)
 */
export const deletePromoCode = async (id: string): Promise<void> => {
  try {
    const promoCodeRef = doc(db, 'promo_codes', id);
    await updateDoc(promoCodeRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    throw error;
  }
};

/**
 * Hard delete a promo code (permanently remove)
 */
export const permanentlyDeletePromoCode = async (id: string): Promise<void> => {
  try {
    const promoCodeRef = doc(db, 'promo_codes', id);
    await deleteDoc(promoCodeRef);
  } catch (error) {
    console.error('Error permanently deleting promo code:', error);
    throw error;
  }
};

/**
 * Get usage history for a specific promo code
 */
export const getPromoCodeUsage = async (
  promoCodeId: string
): Promise<PromoCodeUsage[]> => {
  try {
    const q = query(
      collection(db, 'promo_code_usage'),
      where('promoCodeId', '==', promoCodeId),
      orderBy('appliedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PromoCodeUsage[];
  } catch (error) {
    console.error('Error getting promo code usage:', error);
    return [];
  }
};

/**
 * Get all promo code usage for a specific user
 */
export const getUserPromoCodeUsage = async (
  userId: string
): Promise<PromoCodeUsage[]> => {
  try {
    const q = query(
      collection(db, 'promo_code_usage'),
      where('userId', '==', userId),
      orderBy('appliedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PromoCodeUsage[];
  } catch (error) {
    console.error('Error getting user promo code usage:', error);
    return [];
  }
};

/**
 * Get promo code statistics
 */
export const getPromoCodeStats = async (
  promoCodeId: string
): Promise<{
  totalUsage: number;
  totalRevenue: number;
  usageByPlan: Record<string, number>;
}> => {
  try {
    const usage = await getPromoCodeUsage(promoCodeId);
    
    const stats = {
      totalUsage: usage.length,
      totalRevenue: 0,
      usageByPlan: {} as Record<string, number>,
    };

    usage.forEach((u) => {
      // Count usage by plan
      stats.usageByPlan[u.plan] = (stats.usageByPlan[u.plan] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error getting promo code stats:', error);
    return {
      totalUsage: 0,
      totalRevenue: 0,
      usageByPlan: {},
    };
  }
};

/**
 * Check if a user has used a specific promo code
 */
export const hasUserUsedPromoCode = async (
  userId: string,
  promoCode: string
): Promise<boolean> => {
  try {
    const q = query(
      collection(db, 'promo_code_usage'),
      where('userId', '==', userId),
      where('promoCode', '==', promoCode.toUpperCase())
    );
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking promo code usage:', error);
    return false;
  }
};