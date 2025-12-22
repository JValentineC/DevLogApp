// Frontend Example: Upload Profile Photo to Cloudinary

// In your Profile component or similar:

const handlePhotoUpload = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('photo', file);

    const token = localStorage.getItem('authToken');
    const userId = user.id; // Your current user ID

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/users/${userId}/profile-photo`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData, // Don't set Content-Type, browser will set it with boundary
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log('Photo uploaded:', data.photoUrl);
      // Update user state with new photo URL
      setUser({ ...user, profilePhoto: data.photoUrl });
      // Show success message
      setSuccess('Profile photo updated successfully!');
    } else {
      setError(data.error || 'Failed to upload photo');
    }
  } catch (error) {
    console.error('Upload error:', error);
    setError('Failed to upload photo. Please try again.');
  }
};

// Usage in file input:
<input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  }}
/>

// Display the photo:
<img 
  src={user.profilePhoto || '/default-avatar.png'} 
  alt="Profile" 
  style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '50%' }}
/>
