/* eslint-disable consistent-return */
/* eslint-disable no-empty */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable class-methods-use-this */
import dot from 'dotenv';
import pkg from 'pg';

const { Client } = pkg;

dot.config();

export default class LocalStorage {
  constructor(port) {
    this.client = new Client({
      user: process.env.PGUSER,
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      password: process.env.PGPASSWORD,
      port,
    });
    this.unable = false;
    this.client.connect((err) => {
      if (err) {
        this.unable = true;
      }
    });
  }

  end() {
    this.client.end();
  }

  async save(followers, following, timeline) {
    if (this.unable) return null;
    for (const [key, value] of Object.entries(followers)) {
      this.client.query(`INSERT INTO User_(id, username) VALUES(DEFAULT, '${key}')`);

      let userId = null;
      try {
        const res = await this.client.query(`SELECT * FROM User_ WHERE username='${key}'`);
        if (res.rowCount !== 0) userId = Number(res.rows[0].id);
      } catch (err) {}

      if (userId != null) {
        for (const user of [...value]) {
          let followedId = null;
          try {
            const res = await this.client.query(`SELECT * FROM User_ WHERE username='${user}'`);
            if (res.rowCount !== 0) followedId = Number(res.rows[0].id);
          } catch (err) {}

          if (followedId !== null) {
            this.client.query(`INSERT INTO Followed(id, userId, followedId) VALUES(DEFAULT, ${userId}, ${followedId})`);
          }
        }
      }
    }

    for (const [key, value] of Object.entries(following)) {
      this.client.query(`INSERT INTO User_(id, username) VALUES(DEFAULT, '${key}')`);

      let userId = null;
      try {
        const res = await this.client.query(`SELECT * FROM User_ WHERE username='${key}'`);
        if (res.rowCount !== 0) userId = Number(res.rows[0].id);
      } catch (err) {}

      if (userId !== null) {
        for (const user of [...value]) {
          let followingId = null;
          try {
            const res = await this.client.query(`SELECT * FROM User_ WHERE username='${user}'`);
            if (res.rowCount !== 0) followingId = Number(res.rows[0].id);
          } catch (err) {}

          if (followingId !== null) {
            this.client.query(`INSERT INTO Following(id, userId, followingId) VALUES(DEFAULT, ${userId}, ${followingId})`);
          }
        }
      }
    }

    for (const [key, value] of Object.entries(timeline)) {
      this.client.query(`INSERT INTO User_(id, username) VALUES(DEFAULT, '${key}')`);

      let userId = null;
      try {
        const res = await this.client.query(`SELECT * FROM User_ WHERE username='${key}'`);
        if (res.rowCount !== 0) userId = Number(res.rows[0].id);
      } catch (err) {}

      if (userId !== null) {
        for (const post of value) {
          this.client.query(`INSERT INTO Post(userId, text, timestamp) VALUES(${userId}, '${post.message}', ${post.timestamp})`);
        }
      }
    }
  }

  async load(user) {
    if (this.unable) return null;
    const followers = {};
    const following = {};
    const timeline = {};

    let userId = null;
    let userFollowings = [];

    let res;

    try {
      res = await this.client.query(`SELECT * FROM User_ WHERE username='${user}'`);
      if (res.rowCount !== 0) userId = Number(res.rows[0].id);
    } catch (err) {}

    if (userId === null) return null;

    try {
      res = await this.client.query(`SELECT * FROM Following WHERE userId=${userId}`);
      if (res.rowCount !== 0) userFollowings = res.rows;
    } catch (err) {}

    if (userFollowings === []) return null;

    userFollowings.push({ username: user, id: userId });

    for (const row of userFollowings) {
      const { id, username } = row;

      followers[username] = new Set();
      following[username] = new Set();
      timeline[username] = [];

      try {
        res = await this.client.query(`SELECT * FROM Followed WHERE userId=${id}`);
        if (res.rowCount !== 0) {
          for (const innerRow of res.rows) {
            followers[username].add(innerRow.username);
          }
        }
      } catch (err) {}

      try {
        res = await this.client.query(`SELECT * FROM Following WHERE userId=${id}`);
        if (res.rowCount !== 0) {
          for (const innerRow of res.rows) {
            following[username].add(innerRow.username);
          }
        }
      } catch (err) {}

      try {
        res = await this.client.query(`SELECT * FROM Post WHERE userId=${id}`);
        if (res.rowCount !== 0) {
          for (const innerRow of res.rows) {
            timeline[username].push({ message: innerRow.text, timestamp: innerRow.timestamp });
          }
        }
      } catch (err) {}
    }

    return { followers, following, timeline };
  }
}
