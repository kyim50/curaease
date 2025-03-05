"use client";
import Link from "next/link";
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
import { ChevronLeft, Camera } from 'lucide-react';
import { auth } from '../firebase';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const db = getFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [originalProfileImage, setOriginalProfileImage] = useState<string | null>(user?.photoURL || null);
  const [profileImage, setProfileImage] = useState<string | null>(user?.photoURL || null);
  
  const [originalDisplayName, setOriginalDisplayName] = useState(user?.displayName || '');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  
  const [originalBio, setOriginalBio] = useState('');
  const [bio, setBio] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
            setOriginalProfileImage(data.profileImageUrl);
            setProfileImage(data.profileImageUrl);
          }
          if (data.displayName) {
            setOriginalDisplayName(data.displayName);
            setDisplayName(data.displayName);
          }
          if (data.bio) {
            setOriginalBio(data.bio);
            setBio(data.bio);
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };

    loadProfileData();
  }, [user, db]);

  // Check for changes
  useEffect(() => {
    const imageChanged = profileImage !== originalProfileImage;
    const nameChanged = displayName !== originalDisplayName;
    const bioChanged = bio !== originalBio;
    setHasChanges(imageChanged || nameChanged || bioChanged);
  }, [profileImage, displayName, bio, originalProfileImage, originalDisplayName, originalBio]);

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
          setProfileImage(compressedImage);
        } catch (error) {
          console.error('Image compression error:', error);
          alert('Failed to process image');
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

  const handleSubmitChanges = async () => {
    try {
      if (!user) throw new Error('No user found');

      const profileDocRef = doc(db, 'users', user.uid);
      
      // Update Firestore document
      await setDoc(profileDocRef, {
        displayName: displayName,
        email: user.email,
        profileImageUrl: profileImage,
        bio: bio
      }, { merge: true });

      // Update Firebase auth profile with minimal photo URL
      await updateProfile(user, { 
        displayName: displayName,
        photoURL: user.uid // Use user ID instead of full base64 image
      });

      // Update original values
      setOriginalDisplayName(displayName);
      setOriginalProfileImage(profileImage);
      setOriginalBio(bio);

      alert('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Failed to update profile');
    }
  };

  const handleCancelChanges = () => {
    // Revert changes
    setDisplayName(originalDisplayName);
    setProfileImage(originalProfileImage);
    setBio(originalBio);
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
          <h1 className="text-2xl font-bold text-blue-800">Profile</h1>
        </div>

        <nav className="space-y-2">
          <div 
            onClick={() => router.push('/profile')}
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md font-semibold cursor-pointer"
          >
            Profile Settings
          </div>
          <Link
            href="account-security"
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer"
          >
            Account Security
          </Link>
          <div className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
            Preferences
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-12 space-y-8">
        {/* Profile Overview */}
        <div className="bg-white shadow-lg rounded-xl p-8 flex items-center space-x-8">
          <div className="relative">
            <div className="w-48 h-48 rounded-full border-4 border-blue-500 overflow-hidden shadow-lg">
              <img 
                src={profileImage || '/default-avatar.png'} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/jpeg,image/png,image/gif"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-500 text-white p-3 rounded-full shadow-md hover:bg-blue-600 transition-colors"
                disabled={isUploading}
              >
                <Camera size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-3xl font-bold text-blue-900">{displayName || 'Anonymous User'}</h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>
            
            <input 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Update Display Name" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />

            <textarea 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black h-24"
              placeholder="Add a short bio (max 250 chars)" 
              value={bio}
              maxLength={250}
              onChange={(e) => setBio(e.target.value)}
            />
            
            {hasChanges && (
              <div className="flex space-x-4">
                <button 
                  onClick={handleSubmitChanges}
                  className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors shadow-md"
                >
                  Save Changes
                </button>
                <button 
                  onClick={handleCancelChanges}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;