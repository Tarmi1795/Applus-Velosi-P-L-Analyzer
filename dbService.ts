import { SavedProject } from '../types';

// In a real app, import { getFirestore, collection, addDoc } from 'firebase/firestore';

const STORAGE_KEY = 'applus_projects_db';

export const saveProject = async (project: Omit<SavedProject, 'id' | 'lastModified'>): Promise<SavedProject> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newProject: SavedProject = {
        ...project,
        id: crypto.randomUUID(),
        lastModified: Date.now()
      };
      
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const updated = [newProject, ...existing];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      resolve(newProject);
    }, 1000);
  });
};

export const loadProjects = async (): Promise<SavedProject[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      resolve(existing);
    }, 800);
  });
};