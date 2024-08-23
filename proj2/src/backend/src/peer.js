/* eslint-disable func-names */
/* eslint-disable no-empty */
/* eslint-disable no-loop-func */
/* eslint-disable import/no-import-module-exports */
/* eslint-disable no-await-in-loop */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable max-len */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-empty-function */
/* eslint-disable import/extensions */
import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { mplex } from '@libp2p/mplex';
import { noise } from '@chainsafe/libp2p-noise';
import { kadDHT } from '@libp2p/kad-dht';
import { CID } from 'multiformats/cid';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import * as json from 'multiformats/codecs/json';
import { sha256 } from 'multiformats/hashes/sha2';
import { mdns } from '@libp2p/mdns';
import { pipe } from 'it-pipe';
import dot from 'dotenv';
import { stringToBinary, binaryToString, printNodeData } from './utils.js';
import LocalStorage from './localStorage.js';

dot.config();

const c = console;

let globalPeer = null;

const generateCID = async (username) => {
  const bytes = json.encode({ username });
  const hash = await sha256.digest(bytes);
  return CID.create(1, json.code, hash);
};

const Operation = {
  FOLLOW: 'FOLLOW',
  UNFOLLOW: 'UNFOLLOW',
  POST: 'POST',
};

export default class Peer {
  constructor(dbPort) {
    this.node = null;
    this.username = null;
    this.followers = {};
    this.following = {};
    this.timeline = {};
    this.signedIn = false;
    this.privateKEY = null;
    this.publicKEY = null;
    this.init();
    globalPeer = this;
    this.dbPort = dbPort;
    this.storage = new LocalStorage(this.dbPort);
  }

  async init() {
    const options = {
      start: false,
      addresses: {
        listen: ['/ip4/0.0.0.0/tcp/0'],
      },
      transports: [tcp()],
      streamMuxers: [mplex()],
      connectionEncryption: [noise()],
      dht: kadDHT(),
      pubsub: gossipsub({ allowPublishToZeroPeers: true, emitSelf: true }),
      peerDiscovery: [mdns({ interval: 20e3 })],
    };

    // create node
    this.node = await createLibp2p(options);

    this.node.addEventListener('peer:discovery', (evt) => c.log('🔍 [node] Discovered:', evt.detail.id.toString()));

    this.node.connectionManager.addEventListener('peer:connect', (evt) => { c.log('🐣 [node] Connection established to:', evt.detail.remotePeer.toString()); });

    await this.node.start();

    // subscribe to itself to receive updates
    this.node.pubsub.addEventListener('message', (message) => this.parseMessage(message.detail.data));

    // create protocol to handle inter node communication (to get user data)
    this.node.handle('/user-data', async ({ stream }) => {
      pipe(
        stream,
        (source) => (async function () {
          for await (const msg of source) {
            const username = binaryToString(msg.subarray());
            if (globalPeer.following[username] === undefined) {
              await pipe(
                [stringToBinary(JSON.stringify({ err: 'Not following user' }))],
                stream,
              );
            } else {
              const userData = {
                followers: [...globalPeer.followers[username]],
                following: [...globalPeer.following[username]],
                timeline: globalPeer.timeline[username],
              };
              await pipe(
                [stringToBinary(JSON.stringify(userData))],
                stream,
              );
            }
          }
        }()),
      );
    });

    c.log('🐤 [node] Peer id:  ', this.node.peerId);
  }

  async getProvider(cid) {
    this.node.contentRouting.findProviders(cid).next().then((res) => res.value);
  }

  async setSession(username) {
    this.username = username;
    this.signedIn = true;

    // subscribe to itself
    this.node.pubsub.subscribe(username);

    const cid = await generateCID(username);

    // loading existing user data remotely
    if ((await this.loadUserData(username, true)) === null) {
      this.followers[username] = new Set();
      this.following[username] = new Set();
      this.timeline[username] = [];
    }

    // add provide for itself
    await this.node.contentRouting.provide(cid);
  }

  async sign(data, privateKEY) {
    return privateKEY.sign(Buffer.from(data));
  }

  async verify(data, signature, publicKEY) {
    return publicKEY.verify(Buffer.from(data), signature);
  }

  async follow(username) {
    // check if user does not exist
    try {
      await this.node.contentRouting.get(stringToBinary(`/${username}`), { timeout: 3000 });
    } catch (error) {
      throw new Error(error);
    }

    // check if username is different than its own
    if (this.username === username) throw new Error('Cannot follow itself');

    // check if it is already followed
    c.log(this.following[this.username]);
    if (this.following[this.username].has(username)) throw new Error('Already following user');

    // add set to following and followers
    this.followers[username] = new Set();
    this.following[username] = new Set();
    this.timeline[username] = [];

    // subscribe that username
    this.node.pubsub.subscribe(username);

    // publish to subscribers the follow action
    const message = {
      messageType: Operation.FOLLOW,
      body: {
        from: this.username,
        to: username,
      },
    };

    // update timeline, followers, following with previous data
    if ((await this.loadUserData(username, false)) === null) {
      this.followers[username] = new Set();
      this.following[username] = new Set();
      this.timeline[username] = [];
    }

    // update other nodes
    this.node.pubsub.publish(username, stringToBinary(JSON.stringify(message)));

    const cid = await generateCID(username);

    // set current username as provider for the followed user
    // eslint-disable-next-line no-return-await
    await this.node.contentRouting.provide(cid);
  }

  async unfollow(username) {
    // check if user does not exist
    try {
      await this.node.contentRouting.get(stringToBinary(`/${username}`), { timeout: 3000 });
    } catch (error) {
      throw new Error(error);
    }

    // check if it is already unfollowed or never followed it
    if (!this.following[this.username].has(username)) throw new Error('You do not follow this user');

    // publish to subscribers the follow action
    const message = {
      messageType: Operation.UNFOLLOW,
      body: {
        from: this.username,
        to: username,
      },
    };

    // update other nodes
    this.node.pubsub.publish(username, stringToBinary(JSON.stringify(message)));

    // unsubscribe that username
    // this.node.pubsub.unsubscribe(username);

    // As we do not unprovide, we can't unsubscribe, because we have to keep updated
    // However, there is no problem, because we have removed the follower from the following list,
    // so the unfollowed user posts won't appear in the user timeline
  }

  post(text) {
    // Parse message from request to post structure
    // Add to Timeline
    // Publish message

    const message = {
      messageType: Operation.POST,
      body: {
        username: this.username,
        message: text,
        timestamp: new Date().getTime(),
      },
    };

    this.node.pubsub.publish(this.username, stringToBinary(JSON.stringify(message)));
    // Save post
  }

  async isFollowing(username) {
    if (this.following[this.username] === undefined) return false;
    if (this.following[this.username].has(username)) { return true; }
    return false;
  }

  getFeed(username) {
    // Retrieve timelines of the nodes that the current node follows
    // Sort by Timestamp (newer at the top)

    // check if username is different than its own
    if (this.username !== username) throw new Error("Cannot access other's feed");

    let feed = [];

    for (const post of this.timeline[username]) {
      const newPost = {
        username,
        message: post.message,
        timestamp: post.timestamp,
      };
      feed.push(newPost);
    }

    this.following[username].forEach((user) => {
      const userTimeline = [];

      for (const post of this.timeline[user]) {
        const newPost = {
          username: user,
          message: post.message,
          timestamp: post.timestamp,
        };
        userTimeline.push(newPost);
      }

      feed = feed.concat(userTimeline);
    });
    return feed.sort((a, b) => a.timestamp - b.timestamp);
  }

  async parseMessage(message) {
    // parsing the data string
    const data = binaryToString(message);

    const { messageType, body } = JSON.parse(data);

    if (this.followers[body.to] === undefined) {
      this.followers[body.to] = new Set();
      this.following[body.to] = new Set();
      this.timeline[body.to] = [];
    }

    if (this.followers[body.from] === undefined) {
      this.followers[body.from] = new Set();
      this.following[body.from] = new Set();
      this.timeline[body.from] = [];
    }

    switch (messageType) {
      // update followers and following list
      case Operation.FOLLOW:
        this.followers[body.to].add(body.from);
        this.following[body.from].add(body.to);
        break;
      case Operation.UNFOLLOW:
        this.followers[body.to].delete(body.from);
        this.following[body.from].delete(body.to);
        break;
      case Operation.POST:
        this.timeline[body.username].push({ message: body.message, timestamp: body.timestamp });
        this.timeline[body.username] = this.timeline[body.username].filter((post) => (new Date().getTime() - post.timestamp) < process.env.TIME_TO_LIVE);
        break;
      default:
        break;
    }

    // save to local
    await this.storage.save(this.followers, this.following, this.timeline);
  }

  async streamData(username, stream) {
    // ask for that username's data
    await pipe(
      [stringToBinary(username)],
      stream,
    );

    let userData;

    // read that username's data
    await pipe(
      stream,
      (source) => (async function () {
        for await (const msg of source) {
          const data = binaryToString(msg.subarray());
          userData = JSON.parse(data);
        }
      }()),
    );

    this.followers[username] = new Set(userData.followers);
    this.following[username] = new Set(userData.following);
    this.timeline[username] = userData.timeline;
  }

  async provideData(cid) {
    let provider;
    let stream = null;

    // gets all providers for this user
    const providerGenerator = await this.node.contentRouting.findProviders(cid);

    while (true) {
    // gets the next available provider, breaks when there is an error
      try {
        provider = await providerGenerator.next().then((res) => res.value);
      } catch (error) {
        break;
      }

      // breaks when there are no more providers
      if (provider === undefined) break;

      // tries to dialProtocol, if it can't gets next provider
      try {
        stream = await this.node.dialProtocol(provider.id, ['/user-data']);
        break;
      } catch (error) {}
    }

    return stream;
  }

  async loadUserData(username, withFollowingData) {
    // get provider for user
    // get user data
    // iterate over the following
    // get provider for each of them
    // save data for each of the following users

    let cid = await generateCID(username);
    let stream;

    try {
      stream = await this.provideData(cid);

      // no providers available for the user
      // maybe try and load from local storage ?
      if (stream === null) {
        const userData = await this.storage.load(username);
        if (userData === null) return null;

        this.followers[username] = userData.following[username];
        this.following[username] = userData.followers[username];
        this.timeline[username] = userData.timeline[username];

        printNodeData(this.node);
      }

      await this.streamData(username, stream);
    } catch (error) {}

    if (withFollowingData && this.following[username]) {
      for (const user of [...this.following[username]]) {
        cid = await generateCID(user);
        try {
          stream = await this.provideData(cid);
          // goes to retrieve the data for the other follower if the current isn't provided
          // maybe try and load from local storage ?
          if (stream !== null) await this.streamData(user, stream);
          else {
            const userData = await this.storage.load(user);
            if (userData === null) return null;

            this.followers[user] = userData.following[user];
            this.following[user] = userData.followers[user];
            this.timeline[user] = userData.timeline[user];
          }
        } catch (error) {}
      }
    }

    return 'Successfully loaded user data!';
  }
}
