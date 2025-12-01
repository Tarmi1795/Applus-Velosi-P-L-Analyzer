import { User } from '../types';

// In a real app, import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const MOCK_USER: User = {
  id: 'u-123',
  name: 'Demo Administrator',
  email: 'admin@applus.com',
  role: 'admin',
  avatar: 'https://i.pravatar.cc/150?u=admin'
};

export const login = async (email: string, pass: string): Promise<User> => {
  // Simulation of API call
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email.includes('@') && pass.length > 3) {
        resolve(MOCK_USER);
      } else {
        reject(new Error('Invalid credentials'));
      }
    }, 1500);
  });
};

export const logout = async (): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, 500));
};

export const getSession = (): User | null => {
  const stored = localStorage.getItem('app_session');
  return stored ? JSON.parse(stored) : null;
};