import React, {useState } from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import useAuth from "./useAuth"

import '../style/Navbar.css';

function NavbarParrot({ port, user }) {
  const { clearUser } = useAuth();
  const [username, setUsername] = useState('');

  const signout = () => {
    fetch(`http://localhost:${port}/signup`)
      .then((response) => {
        console.log(response);
        response.json()
      })
      .then((data) => {
        console.log(data);
        clearUser();
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const handleInputChange = (event) => {
    setUsername(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      console.log("Entered ", username);
      window.location.replace(`http://${window.location.host}/user/${username}`);
    }
  };

  return (
    <div className="toolbar">
      <Navbar collapseOnSelect expand="lg" className="container">
        <Navbar.Brand href="/">
          <div className="d-flex align-items-center">
            <img
              width="40"
              alt="Angular Logo"
              src="https://i.pinimg.com/originals/c2/2d/03/c22d033f26fa2d329951849c8d9c4329.png"
            />
            <span className="title">ToEaseParrot</span>
          </div>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" className="me-4" />
        <Navbar.Collapse id="responsive-navbar-nav" className="justify-content-end">
          <Nav className="align-items-end hover-card-container">
            {!user ? (
              <a className="nav-item hover-card" href="/">Log In</a>
            ) : (
              <>
                <a className="nav-item active hover-card" href="/">Feed</a>
                <a className="nav-item hover-card" href="/profile">Profile</a>
                <input type="text" placeholder="Search" className="search-input align-self-center" value={username} onChange={handleInputChange} onKeyDown={handleKeyDown}/>
                <a className="nav-item hover-card" href="/" onClick={signout}>Log Out</a>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    </div>
  );
}

export default NavbarParrot;
