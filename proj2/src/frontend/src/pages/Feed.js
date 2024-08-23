import React, { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import Post from '../components/Post';
import useAuth from "../components/useAuth"
import '../style/Feed.css';

export default function Feed({ port }) {
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState("");
    const { user } = useAuth();

    const getPosts = () => {
        fetch(`http://localhost:${port}/feed/${user}`)
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            if (data.length > 0) {
                setPosts(data.reverse());
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    };

    const post = () => {
        fetch(`http://localhost:${port}/post`, {
            method: 'POST',
            mode: 'cors', // no-cors, *cors, same-origin
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: newPost,
            }),
        })
        .then((response) => response.json())
        .then((data) => {
            setNewPost("");
            getPosts();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    };

    useEffect(() => {
        getPosts();
    }, [posts]);

  return (
    <Container className="d-flex flex-column align-items-center">
        <div className="post-input d-flex flex-column justify-content-center align-content-center align-items-center w-70">
            <h1>Hello, {user}</h1>
            <textarea className="mt-4 form-control w-100 textarea" placeholder="What's on your mind?" onChange={(e) => setNewPost(e.target.value)} value={newPost}></textarea>
            <button className="align-self-end btn btn-primary post-btn" onClick={post}>Post</button>
            <hr />
        </div>
        <div className="post-cards d-flex flex-column justify-content-center align-content-center align-items-center w-100">
            {posts.map((post) => (
                <Post post={post} username={post.username} />
            ))}
        </div> 
    </Container>
  );
}