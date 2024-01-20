// Only authorized for internal testing purposes only; nonproduction code.

"use strict";

const crypto = require('crypto');
const ibc = require('./is-by_config.json');

const ibEncKey = Buffer.from(ibc.ibEncKey);
const ibEncIV = Buffer.from(ibc.ibEncIV);
const httpDate = new Date().toUTCString();

function encrypt(plainText) {
  const cipher = crypto.createCipheriv('aes-256-cbc', ibEncKey, ibEncIV);
  let encrypted = cipher.update(plainText);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('base64');
}

const data = process.argv[2]; // Get the third element of the process.argv array

console.log(`Received data: ${data}`);

const encryptedData = encrypt(data);
const hexID = crypto.createHash('sha256').update(data.toLowerCase()).digest('hex');
const encryptedHashedData = crypto.createHash('sha256').update(encryptedData).digest('hex');
console.log(`HTTP Formatted Date: ${httpDate}`);
console.log(`Encrypted Data: ${encryptedData}`);
console.log(`Hashed Data: ${hexID}`);
console.log(`Encrypted + Hashed Data: ${encryptedHashedData}`);