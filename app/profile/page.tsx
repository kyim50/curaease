"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth-context';
import { updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';
import { auth } from '../firebase';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const db = getFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileImage, setProfileImage] = useState<string | null>(user?.photoURL || null);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isUploading, setIsUploading] = useState(false);

  // Load profile data from Firestore on component mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;

      try {
        const profileDocRef = doc(db, 'users', user.uid);
        const profileDoc = await getDoc(profileDocRef);

        if (profileDoc.exists()) {
          const data = profileDoc.data();
          if (data.profileImageUrl) {
            setProfileImage(data.profileImageUrl);
          }
          if (data.displayName) {
            setDisplayName(data.displayName);
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };

    loadProfileData();
  }, [user, db]);

  const compressImage = (base64Str: string, maxWidth = 300, maxHeight = 300): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress and return new base64 string
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File must be less than 5MB");
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert("Invalid file type. Please upload JPEG, PNG, or GIF.");
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        try {
          // Compress the image
          const compressedImage = await compressImage(base64String);

          // Store compressed image in Firestore
          if (!user) throw new Error('No user found');

          const profileDocRef = doc(db, 'users', user.uid);
          
          // Update Firestore document with image URL
          await setDoc(profileDocRef, {
            profileImageUrl: compressedImage,
            displayName: displayName,
            email: user.email
          }, { merge: true });

          // Update Firebase auth profile with a minimal identifier
          await updateProfile(user, {
            photoURL: `profile_${user.uid}`
          });

          setProfileImage(compressedImage);
          alert('Profile photo updated successfully');
        } catch (error) {
          console.error('Firestore upload error:', error);
          alert('Failed to upload profile photo');
        } finally {
          setIsUploading(false);
        }
      };
    } catch (error) {
      console.error('File reading error:', error);
      setIsUploading(false);
      alert('Failed to process image');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      if (!user) throw new Error('No user found');

      const profileDocRef = doc(db, 'users', user.uid);
      
      // Update Firestore document
      await setDoc(profileDocRef, {
        displayName: displayName,
        email: user.email,
        profileImageUrl: profileImage // Preserve existing image
      }, { merge: true });

      // Update Firebase auth profile
      await updateProfile(user, { 
        displayName: displayName 
      });

      alert('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Failed to update profile');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full bg-white shadow-md rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Profile</h2>
        
        <div className="flex flex-col items-center space-y-6">
          {/* Profile Photo */}
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-blue-500 overflow-hidden">
              <img 
                src={profileImage || '/default-avatar.png'} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept="image/jpeg,image/png,image/gif"
              onChange={handleImageUpload}
              disabled={isUploading}
            />
            <button 
              className="absolute bottom-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-full text-xs shadow-md hover:bg-blue-600 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Change'}
            </button>
          </div>

          {/* Display Name */}
          <div className="w-full space-y-4">
            <input 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              placeholder="Display Name" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <button 
              onClick={handleUpdateProfile}
              className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors shadow-md"
            >
              Update Profile
            </button>
          </div>

          {/* User Email */}
          <div className="w-full">
            <p className="text-sm text-gray-600 text-center">
              Email: {user?.email}
            </p>
          </div>

          {/* Navigation */}
          <button 
            className="w-full bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition-colors"
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;