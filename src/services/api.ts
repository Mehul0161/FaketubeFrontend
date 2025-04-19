import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Register user in MongoDB after Firebase authentication
export const registerUserInMongoDB = async (userData: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}) => {
  try {
    // Ensure we have valid data to send
    const response = await api.post('/auth/register-mongo', {
      firebaseUid: userData.uid,
      email: userData.email || '',
      displayName: userData.displayName || (userData.email ? userData.email.split('@')[0] : 'User'),
      avatar: userData.photoURL || ''
    });
    return response.data;
  } catch (error) {
    console.error('Error registering user in MongoDB:', error);
    throw error;
  }
};

export default api; 