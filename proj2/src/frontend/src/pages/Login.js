import React, { useEffect, useState } from 'react';
// import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
    MDBContainer,
    MDBTabs,
    MDBTabsItem,
    MDBTabsLink,
    MDBTabsContent,
    MDBTabsPane,
    MDBBtn,
    MDBInput,
  }
from 'mdb-react-ui-kit';
import useAuth from "../components/useAuth"
import '../style/Login.css';

export default function Login({ port, setUser }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [key, setKey] = useState('');

  const [justifyActive, setJustifyActive] = useState('tab1');;

  const handleJustifyClick = (value) => {
    if (value === justifyActive) {
      return;
    }
    setJustifyActive(value);
  };

  const getUserDataLogin = () => ({
    username: username,
    privateKEY: key.split("\\n").join("\n"),
  });

  const login = () => {
    const data = getUserDataLogin();
      fetch(`http://localhost:${port}/signin`, {
        method: 'POST',
        mode: 'cors', // no-cors, *cors, same-origin
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          if (data.username !== undefined) {
            setUser(username);
            navigate('/');
          }
        })
        .catch((error) => {
          console.error('Error:', error);
        });
  };

  const getUserDataRegister = () => ({
    username: username,
    publicKEY: key.split("\\n").join("\n"),
  });

  const register = () => {
    const data = getUserDataRegister();
    fetch(`http://localhost:${port}/signup`, {
      method: 'POST',
      mode: 'cors', // no-cors, *cors, same-origin
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then((response) => response.json())
    .then((data) => {
      if (data.username !== undefined) {
        handleJustifyClick('tab1');
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  };

  useEffect(() => {}, [username]);


  return (
    <MDBContainer className="p-3 my-5 d-flex flex-column w-50">

      <MDBTabs pills justify className='mb-3 d-flex flex-row justify-content-between'>
        <MDBTabsItem>
          <MDBTabsLink className="login-btn" onClick={() => handleJustifyClick('tab1')} active={justifyActive === 'tab1'}>
            Login
          </MDBTabsLink>
        </MDBTabsItem>
        <MDBTabsItem>
          <MDBTabsLink className="login-btn" onClick={() => handleJustifyClick('tab2')} active={justifyActive === 'tab2'}>
            Register
          </MDBTabsLink>
        </MDBTabsItem>
      </MDBTabs>

      <MDBTabsContent>

        <MDBTabsPane show={justifyActive === 'tab1'}>

          <MDBInput wrapperClass='mb-4' label='Username' id='form1' type='text' value={username} onChange={e => setUsername(e.target.value)}/>
          <MDBInput wrapperClass='mb-4' label='Private Key' id='form2' type='password' value={key} onChange={e => setKey(e.target.value)}/>
          <MDBBtn className="mb-4 w-100 green" onClick={login}>Sign in</MDBBtn>
          <div className="d-flex flex-row">
            <p className="text-center">Not a member?</p>
            <div className="register ms-2" onClick={() => handleJustifyClick('tab2')}><b>Register</b></div>
          </div>
        </MDBTabsPane>

        <MDBTabsPane show={justifyActive === 'tab2'}>

          <MDBInput wrapperClass='mb-4' label='Username' id='form1' type='text' value={username} onChange={e => setUsername(e.target.value)}/>
          <MDBInput wrapperClass='mb-4' id='form1' type='password' label='Public Key' rows="3" value={key} onChange={e => setKey(e.target.value)} />

          <MDBBtn className="mb-4 w-100 green" onClick={register}>Sign up</MDBBtn>

        </MDBTabsPane>

      </MDBTabsContent>

    </MDBContainer>
  );
}