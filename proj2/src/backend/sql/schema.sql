DROP TABLE IF EXISTS User_;
DROP TABLE IF EXISTS Post;
DROP TABLE IF EXISTS Following;
DROP TABLE IF EXISTS Followed;

CREATE TABLE User_ (
    id SERIAL UNIQUE,
    username varchar(255) NOT NULL PRIMARY KEY
);

CREATE TABLE Following (
    id SERIAL PRIMARY KEY,
    userId INT NOT NULL,
    followingId INT NOT NULL,
    FOREIGN KEY (userId) REFERENCES User_(id),
    FOREIGN KEY (followingId) REFERENCES User_(id),
    UNIQUE (userId, followingId)
);

CREATE TABLE Followed (
    id SERIAL PRIMARY KEY,
    userId INT NOT NULL,
    followedId INT NOT NULL,
    FOREIGN KEY (userId) REFERENCES User_(id),
    FOREIGN KEY (followedId) REFERENCES User_(id),
    UNIQUE (userId, followedId)
);

CREATE TABLE Post (
    userId INT NOT NULL,
	text VARCHAR(255) NOT NULL,
	timestamp BIGINT NOT NULL,
    FOREIGN KEY (userId) REFERENCES User_(id),
    UNIQUE (userId, timestamp)
);
