/* eslint-disable no-restricted-syntax */
/* eslint-disable import/prefer-default-export */

const c = console;

export function printNodeData(peer) {
  c.log('----FOLLOWERS----');
  for (const [key, value] of Object.entries(peer.followers)) {
    c.log('Key: ', key);
    c.log('valueeeee', value);
    c.log('Value: ', new Array(...value).join(' '));
  }

  c.log('----FOLLOWINGS----');
  for (const [key, value] of Object.entries(peer.following)) {
    c.log('Key: ', key);
    c.log('valueeeee', value);
    c.log('Value: ', new Array(...value).join(' '));
  }

  c.log('----TIMELINES----');
  for (const [key, value] of Object.entries(peer.timeline)) {
    c.log('Key: ', key);
    c.log('valueeeee', value);
    c.log('Value: ', new Array(...value).join(' '));
  }
}

export const stringToBinary = (string) => new TextEncoder().encode(string);

export const binaryToString = (binary) => new TextDecoder().decode(binary);
