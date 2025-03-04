"use client";
import React, { useState, useRef } from 'react';
import { 
  updateProfile, 
  updateEmail, 
  updatePassword, 
  User, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from 'firebase/auth';
import { useAuth } from '../auth-context';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react'; // Assuming you're using Lucide icons

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(user?.photoURL || null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGoBack = () => {
    router.push('/dashboard');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Limit image size to 100KB
      if (file.size > 100 * 1024) {
        setError('Image must be smaller than 100KB');
        return;
      }

      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) {
      setError('No user is currently logged in');
      return;
    }

    try {
      // Update profile
      await updateProfile(user, {
        displayName: displayName || undefined,
        photoURL: profileImage || undefined
      });

      // Update email if changed
      if (email !== user.email) {
        // Requires recent authentication
        if (!currentPassword) {
          setError('Please provide current password to change email');
          return;
        }

        // Re-authenticate user
        const credential = EmailAuthProvider.credential(
          user.email!, 
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);

        // Update email
        await updateEmail(user, email);
      }

      // Update password if new password is provided
      if (newPassword) {
        // Requires recent authentication
        if (!currentPassword) {
          setError('Please provide current password to change password');
          return;
        }

        // Re-authenticate user
        const credential = EmailAuthProvider.credential(
          user.email!, 
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);

        // Update password
        await updatePassword(user, newPassword);
      }

      setSuccess('Profile updated successfully');
      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!user) {
    return <div>Please log in to view your profile</div>;
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md relative">
      {/* Back Button */}
      <button 
        onClick={handleGoBack}
        className="absolute top-4 left-4 flex items-center text-gray-600 hover:text-gray-800 transition"
        aria-label="Go back to dashboard"
      >
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-6 text-center">Edit Profile</h1>
      
      {/* Profile Image Upload */}
      <div className="mb-4 flex flex-col items-center">
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />
        <div 
          className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer"
          onClick={triggerFileInput}
        >
          {profileImage ? (
            <img 
              src={profileImage} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-500">Upload Photo</span>
          )}
        </div>
        <button 
          type="button"
          onClick={triggerFileInput}
          className="mt-2 text-blue-600 hover:underline"
        >
          Change Photo
        </button>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-4">
        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block mb-2">
            Display Name
          </label>
          <input 
            type="text" 
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter display name"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block mb-2">
            Email
          </label>
          <input 
            type="email" 
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter email"
          />
        </div>

        {/* Current Password (for authentication) */}
        <div>
          <label htmlFor="currentPassword" className="block mb-2">
            Current Password (required to make changes)
          </label>
          <input 
            type="password" 
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter current password"
          />
        </div>

        {/* New Password */}
        <div>
          <label htmlFor="newPassword" className="block mb-2">
            New Password (optional)
          </label>
          <input 
            type="password" 
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter new password"
          />
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            {success}
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          Update Profile
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;