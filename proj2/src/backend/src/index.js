/* eslint-disable no-restricted-syntax */
/* eslint-disable import/extensions */
/* eslint-disable max-len */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-empty */
import express from 'express';
import crypto from 'crypto';
import NodeRSA from 'node-rsa';
import dot from 'dotenv';

import Peer from './peer.js';
import cors from 'cors';
import { printNodeData, stringToBinary, binaryToString } from './utils.js';
import { reqValidator, schemas } from './middleware.js';

dot.config();

const c = console;
const app = express();
app.use(express.json());
app.use(cors());

const dbPort = Number(process.argv.slice(3)[0]);

const peer = new Peer(dbPort);

// Simplified auth middleware
const checkAuth = (req, res, next) => {
  if (!peer.signedIn) res.status(401).send('Unauthorized!');
  else next();
};

// prints data in node console for testing purposes
app.get('/test-data', async (req, res) => {
  printNodeData(peer);
  res.send('Printed!');
});

// generates public-private rsa key pair for testing
app.get('/generate-keys', async (req, res) => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });

  res.send({ private: privateKey.export({ format: 'pem', type: 'pkcs1' }), public: publicKey.export({ format: 'pem', type: 'pkcs1' }) });
});

// Authentication
app.post('/signup', reqValidator(schemas.signup), async (req, res) => {
  const { username, publicKEY } = req.body;

  // saving the previous user public key
  const prevPublicKey = peer.publicKEY;

  // checking if it is a correct public key
  try {
    // set the public key to that user
    peer.publicKEY = new NodeRSA(publicKEY);
    if (!peer.publicKEY.isPublic()) throw Error('Not a public key');
  } catch (error) {
    res.status(400).send({err: 'Invalid public key'});
    return;
  }

  // check if user already exists
  try {
    await peer.node.contentRouting.get(stringToBinary(`/${username}`));
    res.status(400).send({err: 'Username already exists, please try another one'});
    peer.publicKEY = prevPublicKey;
    return;
  } catch (error) {
    // res.status(400).send({err: 'Unable to register user!'});
    c.log("GET",error);
  }

  // put new users' username and public key in the dht
  try {
    await peer.node.contentRouting.put(stringToBinary(`/${username}`), stringToBinary(publicKEY));
  } catch (error) {
    res.status(400).send({err: 'Unable to register user!'});
    peer.publicKEY = prevPublicKey;
    return;
  }
  const json = JSON.stringify({ username: username });
  res.status(200).send(json);
});

app.post('/signin', reqValidator(schemas.signin), async (req, res) => {
  const { username, privateKEY } = req.body;

  // save the previous private and public keys
  const prevPrivateKey = peer.privateKEY;
  const prevPublicKey = peer.publicKEY;

  // checking if it is a correct private key
  try {
    // set the private key to that user
    peer.privateKEY = new NodeRSA(privateKEY);
    if (!peer.privateKEY.isPrivate()) throw Error('Not a private key');
  } catch (error) {
    res.status(400).send({err: 'Invalid private key'});
    return;
  }

  let retrievedPublicKey;
  let signature;

  try {
    retrievedPublicKey = await peer.node.contentRouting.get(stringToBinary(`/${username}`));

    // set the retrieved public key to that user
    peer.publicKEY = new NodeRSA(binaryToString(retrievedPublicKey));

    // verify that the user has the corespondent private key
    signature = await peer.sign(username, peer.privateKEY);
    if (!peer.verify(username, signature, peer.publicKEY)) throw Error('Incorrect private key');
  } catch (error) {
    res.status(400).send({err: 'User failed to signin'});
    peer.privateKEY = prevPrivateKey;
    peer.publicKEY = prevPublicKey;
    return;
  }

  // set authenticated user session values
  await peer.setSession(username);

  res.status(200).send({ username });
});

app.get('/signout', checkAuth, async (req, res) => {
  peer.signedIn = false;
  peer.username = null;
  res.send('Signed Out');
});

app.get('/isFollowing/:username', checkAuth, async (req, res) => {
  const { username } = req.params;

  const isFollowing = await peer.isFollowing(username);
  const json = JSON.stringify({ isFollowing });
  res.send(json);
});

// Following
app.post('/follow', reqValidator(schemas.follow), checkAuth, async (req, res) => {
  const { username } = req.body;

  // call peer follow procedure
  try {
    await peer.follow(username);
  } catch (error) {
    c.log(error);
    res.status(400).json({err: `Unable to follow ${username}`});
    return;
  }

  res.status(200).json({message: `Followed ${username} successfully!`});
});

app.post('/unfollow', reqValidator(schemas.follow), checkAuth, async (req, res) => {
  const { username } = req.body;

  // call peer unfollow procedure
  try {
    await peer.unfollow(username);
  } catch (error) {
    res.status(400).json({err: `Unable to unfollow ${username}`});
    return;
  }

  res.status(200).json({message: `Unfollowed ${username} successfully!`});
});

// Posting & Timeline
app.post('/post', reqValidator(schemas.post), checkAuth, async (req, res) => {
  const { message } = req.body;

  try {
    peer.post(message);
  } catch (error) {
    res.status(400).json({err: `Unable to post message: ${message}}`});
    return;
  }

  res.status(200).json({err: `Message posted successfully: ${message}`});
});

app.get('/feed/:username', checkAuth, async (req, res) => {
  const { username } = req.params;
  try {
    const timeline = peer.getFeed(username);
    res.status(200).send(timeline);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Profile
app.get('/user/:username', checkAuth, async (req, res) => {
  const { username } = req.params;
  try {
    await peer.loadUserData(username, false);
    const userData = {
      followers: [...peer.followers[username]],
      following: [...peer.following[username]],
      timeline: peer.timeline[username],
    };
    console.log(userData);
    res.status(200).send(userData);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});

let port = null;
if (process.argv.slice(2)[0]) port = Number(process.argv.slice(2)[0]);
else port = process.env.PORT;

app.listen(port, () => {
  c.log(`⚡️[server]: Server is running at ${process.env.HOST}:${port}`);
});
