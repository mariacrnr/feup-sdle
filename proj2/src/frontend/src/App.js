import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import React, { useEffect } from 'react';
import useAuth from './components/useAuth';
import Feed from './pages/Feed';
import Login from './pages/Login';
import Profile from './pages/Profile';
import './App.css';
import NavbarParrot from './components/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
function App({ port }) {
  const otherUser = true;
  const { user, setUser } = useAuth();
  useEffect(() => {}, [user]);
  return (
    <>
      <NavbarParrot port={port} user={user}/>
      <Router>
        <Routes>
          {user === null ? (
            <Route path="/" element={<Login port={port} setUser={setUser}/>} />
          ) : (
            <Route path="/" element={<Feed port={port}/>} />
          )}
          <Route path="/profile" element={<Profile port={port}/>} />
          <Route path="/user/:username" element={<Profile otherUser={otherUser} port={port}/>} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
