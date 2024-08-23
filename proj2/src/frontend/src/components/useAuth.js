import { useState } from 'react';

export default function useAuth() {
  const getUser = () => {
    return sessionStorage.getItem('user');
  };

  const [user, setUser] = useState(getUser());

  const saveUser = username => {
    sessionStorage.setItem('user', username);
    setUser(username);
  };

  const clearUser = () => {
    sessionStorage.removeItem('user');
    setUser();
  }

  return {
    setUser: saveUser,
    clearUser: clearUser,
    user
  }
}