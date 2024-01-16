// is-by.pro: A simple open sourced web application for posting and viewing posts,
// making the end user smarter by forcing the trinary logic usage for each post.
// The more often one posts, the smarter they get; breaking old MK Ultra programming.

// :[[ :HyperSpire-Foundation: OPEN-SOURCE-SOFTWARE: LICENSE: VERSION: 1: ]]:
// [[ "This Open Source Software is licensed
// under the terms and conditions of this contract." ]]
// [[ "We do not warrant that this software will be
// error free, that defects will be corrected, or
// that this software will meet your requirements
// for any particular application." ]]
// [[ "We disclaim all liability for any damages, 
// including and not excluding any others while not
// limited to direct, indirect, special, incidental, or 
// consequential damages, that may result from
// the use of this software, even if we have been 
// advised of the possibility of such damages." ]]
// [[ "We are not responsible for any software
// generated by third parties or by means of
// automated information systems." ]]
// [[ "All rights are reserved by HyperSpire Foundation and its 
// affiliates. Any infringement of these rights is 
// strictly forbidden and shall not be permitted under 
// any circumstance without prior contract." ]]
// [[ "We revoke permission for any Public/Private 
// Persons and fictional legal constructs for 
// censorship or surveillance without Probable Cause as 
// a violation of Civil Law." ]]
// [[ "No color-able contract, corporate statute or 
// fiction of law construct supersedes a Lawful Right.
// Title 18, U.S.C., § 242 - Deprivation Of Rights Under
// Color Of Law: https://www.justice.gov/crt/deprivation-rights-under-color-law" ]] 
// [[ "This serves as a non-expost facto reservation of All 
// Rights. This license does not expire but may be 
// updated by any later version." ]]
// [[ "This license is not a waiver of any rights and is
// not a release of liability. This license does not
// grant any license to use any trademark, service mark,
// or logo of HyperSpire Foundation or its affiliates." ]]
// [[ "Nothing else follows." ]]

const hapi = require('@hapi/hapi');
const inert = require('@hapi/inert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql');
const ibc = require('./is-by_config.json');
const domain = ibc.ibDomain;
const copyright = ibc.ibCopyright;

const init = async () => {
  const server = hapi.server({
    port: ibc.ibPort,
    host: ibc.ibListenAddress,
    tls: {
      ca: fs.readFileSync(ibc.ibCA),
      key: fs.readFileSync(ibc.ibCAKey),
      cert: fs.readFileSync(ibc.ibCACert)
    }
  });

  await server.register(inert);

  server.route({
    method: 'POST',
    path: '/v1/signup',
    handler: async function (request, h) {
      const username = request.payload.username;
      const password = encrypt(request.payload.password);
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

      return generateIBProSignup(username, passwordHash);
    }
  });

  server.route({
    method: 'POST',
    path: '/v1/identity',
    handler: async function (request, h) {
      const username = request.payload.username;
      const password = encrypt(request.payload.password);

      return generateIBProIdentity(request, h, username, password);
    }
  });

  server.route({
    method: 'POST',
    path: '/{param*}',
    handler: async function (request, h) {
      const ibUID = request.headers['ib-uid'] ||= request.payload.ibuid;
      const ibAuthToken = request.headers['ib-authtoken'] ||= request.payload.ibauthtoken;
      const ibSelectedUser = request.path.slice(1);

      return generateIBProSelectedUserResponse(ibUID, ibAuthToken, ibSelectedUser);
    }
  });

  server.route({
    method: 'GET',
    path: '/css/{param*}',
    handler: {
      directory: {
        path: path.join(__dirname, 'webroot/css'),
        redirectToSlash: true,
        index: true,
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/js/{param*}',
    handler: {
      directory: {
        path: path.join(__dirname, 'webroot/js'),
        redirectToSlash: true,
        index: true,
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/images/{param*}',
    handler: {
      directory: {
        path: path.join(__dirname, 'webroot/images'),
        redirectToSlash: true,
        index: true,
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/favicon.ico',
    handler: function (request, h) {
      return h.file('./webroot/images/favicon.ico');
    }
  });

  server.route({
    method: 'GET',
    path: '/robots.txt',
    handler: function (request, h) {
      return h.file('./webroot/robots.txt');
    }
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: async function (request, h) {

      return generateIBProDefaultResponse();
    }
});

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();

const pool = mysql.createPool({
  host: ibc.ibMySQLHost,
  user: ibc.ibMySQLUser,
  password: ibc.ibMySQLPassword,
  database: ibc.ibMySQLDatabase,
  connectionLimit: ibc.ibConnLimit
});

function encrypt(plainText) {
  const cipher = crypto.createCipheriv('aes-256-cbc', ibc.ibEncKey, ibc.ibEncIV);
  let encrypted = cipher.update(plainText);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('base64');
}

function escapeHTML(unsafe) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function unescapeHTML(unsafe) {
  return unsafe
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"",)
    .replaceAll("&#039;", "'");
}

async function selectIBProUser(ibUID) {
  return new Promise((resolve, reject) => {
    pool.query('SELECT username FROM user WHERE id = ?', [ibUID], function (error, selectUserResults, fields) {
      if (error) {
        reject(error);
      } else if (selectUserResults.length > 0) {
        resolve(selectUserResults[0].username);
      } else {
        resolve(null);
      }
    });
  });
}

async function selectIBProUID(ibUser) {
  return { id: crypto.createHash('sha256').update(ibUser.toLowerCase()).digest('hex') };
}

function generateIBProSignup(username, password) {
  return new Promise(async (resolve, reject) => {
    const specialCharRegex = /\W/;
    const ibUID = (await selectIBProUID(username.toLowerCase())).id;
    console.log('ibUID: ' + ibUID);
    const checkUserResults = await selectIBProUser(ibUID);
    console.log('checkUserResults: ' + checkUserResults);
    if (checkUserResults !== null) {
      resolve({
        success: false,
        message: ':[[ :WARNO: username: already-exists: ]]:'
      });
    } else if (specialCharRegex.test(username)) {
      resolve({
        success: false,
        message: ':[[ :WARNO: username: special-characters: not: authorized: ]]:'
      });
    } else if (username.length > 64) {
      resolve({
        success: false,
        message: ':[[ :WARNO: username: too-long: ]]:'
      });
    } else if (password.length > 64) {
      resolve({
        success: false,
        message: ':[[ :WARNO: password: too-long: ]]:'
      });
    } else if (password.length < 8) {
      resolve({
        success: false,
        message: ':[[ :WARNO: password: too-short: ]]:'
      });
    } else {
      pool.query('INSERT INTO user (id, username, password) VALUES (?, ?, ?)', [ibUID, mysql.escape(username.toLowerCase()), password], function (error, addUserResults, fields) {
        if (error) reject(error);
        resolve({
          success: true,
          message: ':[[ :SUCCESS: user-authorized: ]]:'
        });
      });
    }
  });
}

async function generateIBProIdentity(request, h, username, password) {

}

async function generateIBProSelectedUserResponse(ibUID, ibAuthToken, ibSelectedUser) {

}

async function generateIBProDefaultResponse() {
  const domain = ibc.ibDomain;
  const copyright = ibc.ibCopyright;

  return `<!DOCTYPE html>
<html lang="en-US">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" type="text/css" href="/css/is-by.css">
  <script src="/js/is-by_user.js" type="text/javascript"></script>
  <title>:[[ :is-by: pro: anti-social: social-media: ]]:</title>
</head>

<body>
  <div id="main-section">
    <div id="media-section">
      <img src="/images/Death_Angel-555x222.png" alt=":Death_Angel-555x222.png:" width="555"
        height="222">
      <div class="for-the">
        <p><em>:[[ :for-the: [[ QWOD-MJ12: ATSOSSDEV-A: HyperSpire-Foundation: is-by: respecting: is-with: user-privacy: we: is-by: not: is-with: cookies: we: is-by: low-sugar-quantumite-diet: is-with: custom-identity-service: is-by: encrypted-authorization: is-with: MySQL: backend: HAX0RY: ]]: ]]:</em></p>
      </div>
      <div class="is-by">
        <h1 class="warno">:[[ :is-by: pro: for-the: [[ anti-social: social-media: for-the: [[ PEOPLE: is-by: WE: people: ]]: ]]: ]]:</h1>
      </div>
      <div class="is-with">
        :[[ :is-with: <a href="https://github.com/hyperspire">HyperSpire-Foundation</a>: ]]:
      </div>

      <div id="footer-section">
        <p class="copyright">:[[ :for-the: [[ is-by: pro: is-by: @: ${copyright}: is-with: <a target="_blank"
          rel="noopener" href="http://hyperspire.com/">HyperSpire-Foundation</a>:
          for-the: [[ Death-Angel: is-by: @: is-with: <a target="_blank"
            rel="noopener" href="https://www.youtube.com/@WhiteBatAudio">Karl-Casey</a>: ]]: ]]: ]]:</p>
      </div>
    </div>
    <div id="actions-section">
      <div class="login-section">
        <form id="login" action="https://${domain}/v1/identity" method="POST">
          <input type="text" placeholder="Username" name="username"  autocomplete="username" required>
          <input type="password" placeholder="Password" name="password" autocomplete="current-password" required>
          <input type="submit" value="Login">
          <p id="login-message"></p>
        </form>
      </div>
      <div class="signup-section">
        <form id="signup" action="https://${domain}/v1/signup" method="POST">
          <input type="text" placeholder="Username" name="username" autocomplete="username" required>
          <input type="password" placeholder="Password" name="password" autocomplete="new-password" required>
          <input type="submit" value="Signup">
          <p id="signup-message"></p>
        </form>
      </div>
    </div>

  </div>
</body>

</html>`;
}
