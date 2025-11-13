import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Button } from '@/components/common/Button';

export const SetupAdmin = () => {
  const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const createAdmin = async () => {
    setStatus('creating');
    setError('');

    const adminEmail = 'admin@yourschool.com';
    const adminPassword = 'SecureAdmin123!';
    const adminName = 'System Administrator';

    try {
      console.log('Creating admin account...');

      // Step 1: Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        adminEmail,
        adminPassword
      );

      console.log('✅ Auth user created:', userCredential.user.uid);

      // Step 2: Update profile
      await updateProfile(userCredential.user, {
        displayName: adminName,
      });

      console.log('✅ Profile updated');

      // Step 3: Create Firestore document with role
      const adminData = {
        email: adminEmail,
        role: 'admin',
        profile: {
          fullName: adminName,
        },
        settings: {
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
        },
        metadata: {
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          isActive: true,
          isEmailVerified: true,
        },
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), adminData);

      console.log('✅ Firestore document created with role: admin');
      console.log('✅✅✅ ADMIN CREATED SUCCESSFULLY! ✅✅✅');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
      console.log('UID:', userCredential.user.uid);

      setStatus('success');
    } catch (err: any) {
      console.error('❌ Error creating admin:', err);
      setError(err.message);
      
      // Check if user already exists
      if (err.code === 'auth/email-already-in-use') {
        setError('Admin account already exists! Try logging in.');
      }
      
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-2">✅ Admin Account Created Successfully!</h2>
          <div className="bg-green-700 p-4 rounded mb-4 font-mono text-sm">
            <p><strong>Email:</strong> admin@yourschool.com</p>
            <p><strong>Password:</strong> SecureAdmin123!</p>
            <p><strong>Login at:</strong> /admin/login</p>
          </div>
          <p className="text-yellow-200 font-bold">
            ⚠️ Now remove {`<SetupAdmin />`} from App.tsx!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-6 rounded-lg shadow-2xl max-w-sm">
      <h3 className="text-lg font-bold mb-2">🔧 Setup Required</h3>
      <p className="text-sm mb-4">Create the admin account for first-time setup</p>
      
      {status === 'error' && (
        <div className="bg-red-500 p-3 rounded mb-4 text-sm">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      <Button
        onClick={createAdmin}
        disabled={status === 'creating'}
        className="w-full bg-white text-purple-600 hover:bg-gray-100"
      >
        {status === 'creating' ? 'Creating Admin...' : 'Create Admin Account'}
      </Button>
      
      <p className="text-xs mt-3 opacity-75">
        This will create: admin@yourschool.com
      </p>
    </div>
  );
};