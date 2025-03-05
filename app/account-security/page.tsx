"use client";
import React, { useState } from 'react';
import { useAuth } from '../auth-context';
import { 
  reauthenticateWithCredential, 
  updatePassword, 
  deleteUser,
  EmailAuthProvider 
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Lock, Trash2, Shield } from 'lucide-react';

const AccountSecurityPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Two-Factor Authentication State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Account Deletion States
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    // Validate password
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    try {
      if (!user || !user.email) throw new Error('No user found');

      // Re-authenticate the user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      alert('Password updated successfully');
    } catch (error: any) {
      console.error('Password update error:', error);
      setPasswordError(error.message || 'Failed to update password');
    }
  };

  const handleTwoFactorToggle = () => {
    // In a real implementation, this would integrate with a 2FA service
    // For this example, we'll just toggle the state
    setTwoFactorEnabled(!twoFactorEnabled);
    alert('Two-Factor Authentication is a placeholder feature');
  };

  const handleAccountDeletion = async () => {
    if (deleteConfirmation !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account deletion');
      return;
    }

    try {
      if (!user || !user.email) throw new Error('No user found');

      // Re-authenticate the user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Delete the user
      await deleteUser(user);

      // Redirect to home or login page
      router.push('/');
    } catch (error: any) {
      console.error('Account deletion error:', error);
      setDeleteError(error.message || 'Failed to delete account');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white shadow-xl p-6 border-r border-gray-200 flex flex-col">
        <div className="flex items-center space-x-4 mb-8">
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-blue-800">Security</h1>
        </div>

        <nav className="space-y-2">
          <div 
            onClick={() => router.push('/profile')}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer"
          >
            Profile Settings
          </div>
          <div 
            onClick={() => router.push('/account-security')}
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md font-semibold cursor-pointer"
          >
            Account Security
          </div>
          <div className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
            Preferences
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-12 space-y-8">
        {/* Password Change Section */}
        <div className="bg-white shadow-lg rounded-xl p-8 space-y-6">
          <div className="flex items-center space-x-4 border-b pb-4">
            <Lock className="text-blue-600" size={24} />
            <h3 className="text-2xl font-semibold text-blue-800">Change Password</h3>
          </div>
          
          <form onSubmit={handlePasswordChange} className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <input 
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <input 
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-4">
              <input 
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Confirm New Password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
              
              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}
              
              <button 
                type="submit"
                className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors shadow-md"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* Two-Factor Authentication Section */}
        <div className="bg-white shadow-lg rounded-xl p-8 space-y-6">
          <div className="flex items-center space-x-4 border-b pb-4">
            <Shield className="text-blue-600" size={24} />
            <h3 className="text-2xl font-semibold text-blue-800">Two-Factor Authentication</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-medium text-gray-800">Enable Two-Factor Authentication</h4>
              <p className="text-gray-600">Add an extra layer of security to your account</p>
            </div>
            
            <button 
              onClick={handleTwoFactorToggle}
              className={`px-6 py-2 rounded-md transition-colors ${
                twoFactorEnabled 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {twoFactorEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        {/* Account Deletion Section */}
        <div className="bg-white shadow-lg rounded-xl p-8 space-y-6">
          <div className="flex items-center space-x-4 border-b pb-4">
            <Trash2 className="text-red-600" size={24} />
            <h3 className="text-2xl font-semibold text-red-800">Delete Account</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-700">
              Deleting your account is a permanent action and cannot be undone. 
              This will remove all your data from our system.
            </p>
            
            <input 
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
              placeholder="Confirm Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            
            <input 
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
              placeholder="Type DELETE to confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
            />
            
            {deleteError && (
              <p className="text-red-500 text-sm">{deleteError}</p>
            )}
            
            <button 
              onClick={handleAccountDeletion}
              className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition-colors shadow-md"
            >
              Permanently Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSecurityPage;