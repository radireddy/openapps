// This file simulates a simple asynchronous database.
// In a real application, these functions would make API calls to a backend server.

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  active: boolean;
}

let users: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice.j@example.com', role: 'Admin', active: true },
  { id: 2, name: 'Bob Williams', email: 'bob.w@example.com', role: 'Editor', active: true },
  { id: 3, name: 'Charlie Brown', email: 'charlie.b@example.com', role: 'Viewer', active: false },
  { id: 4, name: 'Diana Miller', email: 'diana.m@example.com', role: 'Editor', active: true },
];

let nextId = 5;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getUsers = async (): Promise<User[]> => {
  await delay(300); // Simulate network latency
  return [...users];
};

export const addUser = async (user: Omit<User, 'id'>): Promise<User> => {
  await delay(300);
  const newUser = { ...user, id: nextId++ };
  users.push(newUser);
  return newUser;
};

export const updateUser = async (id: number, updates: Partial<User>): Promise<User | null> => {
  await delay(300);
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return null;
  }
  users[userIndex] = { ...users[userIndex], ...updates };
  return users[userIndex];
};

export const deleteUser = async (id: number): Promise<boolean> => {
  await delay(300);
  const initialLength = users.length;
  users = users.filter(u => u.id !== id);
  return users.length < initialLength;
};