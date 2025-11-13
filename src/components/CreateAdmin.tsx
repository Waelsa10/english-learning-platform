import { useState } from 'react';
import { registerAdmin } from './../lib/firebase/auth';

export const CreateAdmin = () => {
  const [created, setCreated] = useState(false);

  const handleCreateAdmin = async () => {
    try {
      await registerAdmin({
        email: 'admin@yourschool.com',
        password: 'SecureAdmin123!',
        fullName: 'System Administrator'
      });
      setCreated(true);
      alert('Admin created! Check console for credentials.');
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  if (created) {
    return (
      <div style={{ padding: '20px', background: '#d4edda', color: '#155724' }}>
        ✅ Admin created successfully!<br/>
        Email: admin@yourschool.com<br/>
        Password: SecureAdmin123!<br/>
        <strong>Please remove this component now!</strong>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <button 
        onClick={handleCreateAdmin}
        style={{ padding: '10px 20px', fontSize: '16px' }}
      >
        Create Admin Account
      </button>
    </div>
  );
};