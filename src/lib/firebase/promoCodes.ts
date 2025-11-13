import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { PromoCode, PromoCodeUsage } from '@/types';

export const createPromoCode = async (
  promoCode: Omit<PromoCode, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>
): Promise<string> => {
  try {
    const promoCodeRef = doc(collection(db, 'promo_codes'));
    await setDoc(promoCodeRef, {
      ...promoCode,
      code: promoCode.code.toUpperCase(),
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

export const getPromoCodeByCode = async (
  code: string
): Promise<PromoCode | null> => {
  try {
    const q = query(
      collection(db, 'promo_codes'),
      where('code', '==', code.toUpperCase()),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as PromoCode;
  } catch (error) {
    console.error('Error getting promo code:', error);
    throw error;
  }
};

export const getAllPromoCodes = async (): Promise<PromoCode[]> => {
  try {
    const q = query(
      collection(db, 'promo_codes'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PromoCode[];
  } catch (error) {
    console.error('Error getting promo codes:', error);
    throw error;
  }
};

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
      return { valid: false, error: 'Promo code is inactive' };
    }

    const now = new Date();
    const validFrom = promoCode.validFrom.toDate();
    const validUntil = promoCode.validUntil.toDate();

    if (now < validFrom) {
      return { valid: false, error: 'Promo code is not yet valid' };
    }

    if (now > validUntil) {
      return { valid: false, error: 'Promo code has expired' };
    }

    if (
      promoCode.usageLimit !== null &&
      promoCode.usageCount >= promoCode.usageLimit
    ) {
      return { valid: false, error: 'Promo code usage limit reached' };
    }

    // Check if user already used this promo code
    const usageQuery = query(
      collection(db, 'promo_code_usage'),
      where('userId', '==', userId),
      where('promoCodeId', '==', promoCode.id)
    );
    const usageSnapshot = await getDocs(usageQuery);

    if (!usageSnapshot.empty) {
      return { valid: false, error: 'You have already used this promo code' };
    }

    // Check if promo code is applicable to the selected plan
    if (
      promoCode.applicablePlans.length > 0 &&
      !promoCode.applicablePlans.includes(plan as any)
    ) {
      return { valid: false, error: 'Promo code not applicable to this plan' };
    }

    return { valid: true, promoCode };
  } catch (error) {
    console.error('Error validating promo code:', error);
    return { valid: false, error: 'Error validating promo code' };
  }
};

export const applyPromoCode = async (
  promoCodeId: string,
  userId: string,
  userName: string,
  promoCode: string,
  discountPercentage: number
): Promise<void> => {
  try {
    // Create usage record
    const usageRef = doc(collection(db, 'promo_code_usage'));
    await setDoc(usageRef, {
      promoCodeId,
      promoCode: promoCode.toUpperCase(),
      userId,
      userName,
      discountPercentage,
      appliedAt: serverTimestamp(),
    });

    // Increment usage count
    const promoCodeRef = doc(db, 'promo_codes', promoCodeId);
    await updateDoc(promoCodeRef, {
      usageCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    // Update student document
    await updateDoc(doc(db, 'students', userId), {
      appliedPromoCode: {
        code: promoCode.toUpperCase(),
        discountPercentage,
        appliedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error applying promo code:', error);
    throw error;
  }
};

export const updatePromoCode = async (
  id: string,
  updates: Partial<PromoCode>
): Promise<void> => {
  try {
    const promoCodeRef = doc(db, 'promo_codes', id);
    await updateDoc(promoCodeRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating promo code:', error);
    throw error;
  }
};

export const togglePromoCodeStatus = async (
  id: string,
  isActive: boolean
): Promise<void> => {
  try {
    await updatePromoCode(id, { isActive });
  } catch (error) {
    console.error('Error toggling promo code status:', error);
    throw error;
  }
};

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
    throw error;
  }
};