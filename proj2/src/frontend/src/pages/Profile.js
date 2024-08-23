import React, { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import {
    MDBCol, MDBRow, MDBCard, MDBCardTitle, MDBCardBody, MDBCardImage, MDBBtn,
} from "mdb-react-ui-kit";
import { useParams } from "react-router-dom";
import useAuth from "../components/useAuth"
import Post from '../components/Post';
import '../style/Feed.css';

export default function Profile({ otherUser, port }) {
    const [posts, setPosts] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [error, setError] = useState(false);
    const { user } = useAuth();
    let { username } = useParams();
    const getProfile = () => {
        console.log("getProfile", username);
        if (username === undefined) {
            username = user;
        }
        fetch(`http://localhost:${port}/user/${username}`)
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            setFollowers(data.followers);
            setFollowing(data.following);
            setPosts(data.timeline.reverse());
            setError(false);
        })
        .catch((error) => {
            setError(true);
            console.error('Error:', username);
            let alert = document.getElementById("alertInfo");
            alert.innerText = `User "${username}" was not found!`;
            alert.className = "alert alert-danger";
            alert.setAttribute("role", "alert");
            alert.setAttribute("style", "margin-top: 1rem; width: 50%");
            console.error('Error:', error);
        });
    };

    const getIsFollowing = () => {
        fetch(`http://localhost:${port}/isFollowing/${username}`)
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            setIsFollowing(data.isFollowing);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    };

    const handleFollow = () => {
        if (isFollowing) {
            fetch(`http://localhost:${port}/unfollow`, {
                method: 'POST',
                mode: 'cors', // no-cors, *cors, same-origin
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                }),
            })
            .then((response) => response.json())
            .then((data) => {
                console.log(data.message);
                setIsFollowing(false);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        } else {
            fetch(`http://localhost:${port}/follow`, {
                method: 'POST',
                mode: 'cors', // no-cors, *cors, same-origin
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                }),
            })
            .then((response) => response.json())
            .then((data) => {
                console.log(data.message);
                setIsFollowing(true);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        }
                
    };

    useEffect(() => {
        setError(true);
        getProfile();
        getIsFollowing();
    }, [username, otherUser]);

  return (
    <Container>
        <MDBRow className="justify-content-center w-100">
            {error ? (
                <div id="alertInfo"></div>
            ) : (
                <MDBCol md="9" lg="7" className="mt-3 mb-3">
                    <MDBCard style={{ borderRadius: '15px' }}>
                    <MDBCardBody className="p-4">
                        <div className="d-flex text-black">
                            <div className="flex-shrink-0">
                                <MDBCardImage
                                style={{ width: '180px', borderRadius: '10px' }}
                                src='https://source.unsplash.com/random/200x200?sig=incrementingIdentifier'
                                alt='Generic placeholder image'
                                fluid />
                            </div>
                            <div className="flex-grow-1 ms-3">
                                <MDBCardTitle>{username}</MDBCardTitle>

                                <div className="d-flex justify-content-start rounded-3 p-2 mb-2" style={{ backgroundColor: '#efefef', width: 'fit-content' }}>
                                    <div className="px-3">
                                        <p className="small text-muted mb-1">Followers</p>
                                        <p className="mb-0 d-flex justify-content-center">{followers.length}</p>
                                    </div>
                                    <div className="px-3">
                                        <p className="small text-muted mb-1">Following</p>
                                        <p className="mb-0 d-flex justify-content-center">{following.length}</p>
                                    </div>
                                </div>
                                {otherUser && (user !== username) && (
                                    <div className="d-flex pt-1">
                                        {isFollowing ? (
                                            <MDBBtn className="flex-grow-1 mt-5 unfollow" onClick={handleFollow}>Unfollow</MDBBtn>
                                        ) : (
                                            <MDBBtn className="flex-grow-1 mt-5 follow" onClick={handleFollow}>Follow</MDBBtn>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </MDBCardBody>
                    </MDBCard>
                </MDBCol>
            )}
        </MDBRow>
        <div className="post-cards d-flex flex-column justify-content-center align-content-center align-items-center w-100">
            {posts.map((post) => {
                console.log(username);
                if (username === undefined)
                    return (<Post post={post} username={user} />)
                else
                    return (<Post post={post} username={username} />)
            })}
        </div> 
    </Container>
  );
}