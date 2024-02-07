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

      return generateSignup(username, passwordHash);
    }
  });

  server.route({
    method: 'POST',
    path: '/v1/identity',
    handler: async function (request, h) {
      const username = request.payload.username;
      const password = encrypt(request.payload.password);
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

      return generateIdentity(request, h, username, passwordHash);
    }
  });

  server.route({
    method: 'POST',
    path: '/{param*}',
    handler: async function (request, h) {
      const ibUID = request.headers['ib-uid'] ||= request.payload.ibuid;
      const ibAuthToken = request.headers['ib-authtoken'] ||= request.payload.ibauthtoken;
      const ibSelectedUser = request.path.slice(1);

      return generateSelectedAuthUserResponse(request, h, ibUID, ibAuthToken, ibSelectedUser.toLowerCase());
    }
  });

  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: async function (request, h) {
      const ibSelectedUser = request.path.slice(1);

      return generateSelectedUserResponse(request, h, ibSelectedUser.toLowerCase());
    }
  });

  server.route({
    method: 'POST',
    path: '/v1/post',
    handler: async function (request, h) {
      const ibUID = request.headers['ib-uid'] ||= request.payload.ibuid;
      const ibAuthToken = request.headers['ib-authtoken'] ||= request.payload.ibauthtoken;
      const ibPostForThe = request.payload.forthe;
      const ibPostIsBy = request.payload.isby;
      const ibPostIsWith = request.payload.iswith;

      return generatePost(request, h, ibUID, ibAuthToken, ibPostForThe, ibPostIsBy, ibPostIsWith);
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

      return generateDefaultResponse();
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
    .replaceAll("'", "&#039;")
    .replaceAll("(", "&#040;")
    .replaceAll(")", "&#041;");
}

function unescapeHTML(unsafe) {
  return unsafe
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"",)
    .replaceAll("&#039;", "'")
    .replaceAll("&#040;", "(")
    .replaceAll("&#041;", ")");
}

function convertUrlsToLinks(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
}

async function authenticateUser(ibUID, ibAuthToken) {
  return new Promise((resolve, reject) => {
    pool.query('SELECT username FROM user WHERE id = ? AND authtoken = ?', [ibUID, ibAuthToken], function (error, authUserResults, fields) {
      if (error) {
        reject(error);
      } else if (authUserResults.length > 0) {
        resolve(true);
      } else {
        resolve(null);
      }
    });
  });
}

async function selectUser(ibUID) {
  return new Promise((resolve, reject) => {
    pool.query('SELECT username FROM user WHERE id = ?', [ibUID], function (error, selectUserResults, fields) {
      if (error) {
        reject(error);
      } else if (selectUserResults.length > 0) {
        resolve(selectUserResults[0].username.replace(/'/g, ""));
      } else {
        resolve(null);
      }
    });
  });
}

async function selectUID(ibUser) {
  return { id: crypto.createHash('sha256').update(ibUser.toLowerCase()).digest('hex') };
}

function generateSignup(username, password) {
  return new Promise(async (resolve, reject) => {
    const specialCharRegex = /\W/;
    const ibUID = (await selectUID(username.toLowerCase())).id;
    const checkUserResults = await selectUser(ibUID);
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
    } else if (username.length > 128) {
      resolve({
        success: false,
        message: ':[[ :WARNO: username: too-long: ]]:'
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

async function generateIdentity(request, h, username, password) {
  const ibUID = (await selectUID(username.toLowerCase())).id;
  const remoteAddress = request.info.remoteAddress;
  const userAgent = request.headers['user-agent'];
  const httpDate = new Date().toUTCString();
  const ibAuthToken = encrypt(ibUID + username + password + remoteAddress + userAgent + httpDate);
  const ibAuthTokenHash = crypto.createHash('sha256').update(ibAuthToken).digest('hex');
  return new Promise(async (resolve, reject) => {
    pool.query('SELECT username FROM user WHERE id = ? AND password = ?', [ibUID, password], function (error, authUserResults, fields) {
      if (error) reject(error);
      if (authUserResults.length === 0) {
        resolve({
          success: false,
          message: ':[[ :WARNO: username-password-combination: incorrect: ]]:'
        });
      } else {
        pool.query('UPDATE user SET authtoken = ?, lastlog = ? WHERE id = ? AND password = ?', [ibAuthTokenHash, httpDate, ibUID, password], function (error, authTokenResults, fields) {
          if (error) reject(error);
        });

        const response = h.response({
          success: true,
          message: ':[[ :SUCCESS: user-authorized: ]]:'
        });

        response.header('ib-uid', ibUID);
        response.header('ib-authtoken', ibAuthTokenHash);

        resolve(response);
      }
    });

  });

}

async function generateSelectedAuthUserResponse(request, h, ibUID, ibAuthToken, ibSelectedUser) {
  return new Promise(async (resolve, reject) => {
    const domain = ibc.ibDomain;
    const ibSelectedUserID = (await selectUID(ibSelectedUser)).id;
    const ibUser = await selectUser(ibUID);
    const ibPostResultsMaximum = 200;
    let selectedUserAuthResponseTop = '';
    let selectedUserPostsResponseContent = '';
    let selectedUserAuthResponseBottom = '';
    let selectedUserAuthResponse = '';

    pool.query('SELECT authtoken FROM user WHERE id = ? AND authtoken = ?', [ibUID, ibAuthToken], function (error, authTokenResults, fields) {
      if (error) reject(error);

      if (authTokenResults.length < 1) {
        // No valid AuthToken found, generate default response.
        resolve(generateDefaultResponse());
      } else {
        // Valid AuthToken found, generate authenticated content.
        selectedUserAuthResponseTop = `<!DOCTYPE html>
<html lang="en-US">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" type="text/css" href="/css/is-by.css">
    <script src="/js/is-by_user.js" type="text/javascript"></script>
    <title>:[[ :is-by: pro: ${ibSelectedUser}: ]]:</title>
</head>

<body>
    <form id="select-user-form" action="/" method="GET">
      <input type="hidden" name="ibuid" value="${ibUID}">
      <input type="hidden" name="ibauthtoken" value="${ibAuthToken}">
      <input type="hidden" name="ibselecteduser" value="${ibSelectedUser}">
    </form>
    <form id="select-post-form" action="https://${domain}/v1/showpost" method="GET">
      <input type="hidden" name="ibuid" value="${ibUID}">
      <input type="hidden" name="ibauthtoken" value="${ibAuthToken}">
      <input type="hidden" name="ibselecteduser" value="${ibSelectedUser}">
      <input type="hidden" name="pid" value="">
    </form>
    <form id="edit-post-form" action="https://${domain}/v1/editpost" method="GET">
      <input type="hidden" name="ibuid" value="${ibUID}">
      <input type="hidden" name="ibauthtoken" value="${ibAuthToken}">
      <input type="hidden" name="ibselecteduser" value="${ibSelectedUser}">
      <input type="hidden" name="pid" value="">
    </form>
    <form id="delete-post-form" action="https://${domain}/v1/deletepost" method="POST">
      <input type="hidden" name="ibuid" value="${ibUID}">
      <input type="hidden" name="ibauthtoken" value="${ibAuthToken}">
      <input type="hidden" name="ibselecteduser" value="${ibSelectedUser}">
      <input type="hidden" name="pid" value="">
    </form>
    <form id="edit-profile-form" action="https://${domain}/v1/profile" method="POST">
      <input type="hidden" name="ibuid" value="${ibUID}">
      <input type="hidden" name="ibauthtoken" value="${ibAuthToken}">
    </form>
    <div id="main-section">
      <div id="media-section">
        <div>
        <img src="/images/Death_Angel-555x111.png" alt=":Death_Angel-555x111.png:" width="555"
            height="111">
        </div>
        <div id="navigation-section">
          <a class="post-form-display" href="javascript:void(0);">:[[ :post: ]]:</a>
          <a class="pro-home-display" href="${ibUser}">:[[ :profile-home: ]]:</a>
          <a class="show-edit-profile" href="javascript:void(0);">:[[ :edit-profile: ]]:</a>
        </div>
        <div id="post-form-section">
          <form id="post" action="https://${domain}/v1/post" method="POST">
            <div id="post-message"></div>
            <div id="post-character-count"></div>
            <input type="hidden" name="ibuid" value="${ibUID}">
            <input type="hidden" name="ibauthtoken" value="${ibAuthToken}">
            <input class="post-for-the" type="text" placeholder="for-the:" name="forthe" autocomplete="off" required>
            <input class="post-is-by" type="textfield" placeholder="is-by:" name="isby" autocomplete="off" required>
            <input class="post-is-with" type="text" placeholder="is-with:" name="iswith" autocomplete="off" required>
            <input id="post-cancel" class="post-cancel" type="button" value="Cancel">
            <input class="post-submit" type="submit" value="Post">
          </form>
        </div>`;
        // CREATE TABLE isby.post (id varchar(64), postid varchar(64), forthe varchar(1024), isby varchar(1024), iswith varchar(1024), timestamp varchar(32));
        let ibPostID = '';
        let ibPostForThe = '';
        let ibPostIsBy = '';
        let ibPostIsWith = '';
        let ibPostTimestamp = '';
        let ibPostResults = [];
        let ibPostResultsLength = 0;
        new Promise((resolve, reject) => {
          pool.query('SELECT postid, forthe, isby, iswith, timestamp FROM post WHERE id = ? LIMIT ?', [ibSelectedUserID, ibPostResultsMaximum], function(error, results, fields) {
            if (error) return reject(error);
            ibPostResults = results;
            ibPostResultsLength = ibPostResults.length - 1;
            selectedUserPostsResponseContent += `<div class="notice"><p><em>:[[ :for-the: [[ posts: is-by: ${ibPostResultsLength}: is-with: showing-latest-results: truncated: is-by: ${ibPostResultsMaximum} ]]: ]]:</em></p></div>`;
            // Post display algorithm:
            for (let i = ibPostResultsLength; i > 0; i--) {
              const ibPostRow = ibPostResults[i];
              ibPostID = ibPostRow.postid;
              ibPostForThe = ibPostRow.forthe;
              ibPostIsBy = ibPostRow.isby;
              ibPostIsWith = ibPostRow.iswith;
              ibPostTimestamp = ibPostRow.timestamp;
        
              if (ibUID === ibSelectedUserID) {
                // Logged in user is the selected user, show edit and delete menu options.
                selectedUserPostsResponseContent += `
        <div class="post-section">
          <div class="for-the">
            <!-- :[[ :for-the: [[ Δ: { ^ <userid: ${ibUID}> ^ }: ]]:= { postid: "${ibPostID}" }: ]]: -->
            <div><span class="heading">:[[ :for-the: [[ ${ibPostForThe}: ]]: ]]:</span></div>
          </div>
          <div class="is-by">
            <div><span class="paragraph">:[[ :is-by: ${ibPostIsBy}: ]]:</span></div>
          </div>
          <div class="is-with">
            <div><span class="description">:is-with: ${ibPostIsWith}: <a class="select-user" href="${ibUser}">${ibUser}</a>: ${ibPostTimestamp}</span></div><br>
            <div><span class="description"><a class="post-link" href="${ibPostID}">:[[ :post-link: ]]:</a> <a class="edit-post" href="${ibPostID}">:[[ :edit: ]]: </a> <a class="delete-post" href="${ibPostID}">:[[ :delete: ]]:</a></span></div>
          </div>
        </div>`;
              } else {
                // Logged in user is not the selected user, do not show edit and delete menu options.
                selectedUserPostsResponseContent += `
        <div class="post-section">
          <div class="for-the">
            <!-- :[[ :for-the: [[ Δ: { ^ <userid: ${ibUID}> ^ }: ]]:= { postid: "${ibPostID}" }: ]]: -->
            <div><span class="heading">:[[ :for-the: [[ ${ibPostForThe}: ]]: ]]:</span></div>
          </div>
          <div class="is-by">
            <div><span class="paragraph">:[[ :is-by: ${ibPostIsBy}: ]]:</span></div>
          </div>
          <div class="is-with">
            <div><span class="description">:is-with: ${ibPostIsWith}: <a class="post-link" href="${ibPostID}">:[[ :post-link: ]]:</a> <a class="select-user" href="${ibSelectedUser}">${ibSelectedUser}</a>: ${ibPostTimestamp}:</span></div>
          </div>
        </div>`;
              }
            }
            resolve(selectedUserPostsResponseContent);
          });
        })
        .then(selectedUserPostsResponseContent => {
          const proResults = pool.query('SELECT ibp, pro, location, services, website, github FROM pro WHERE id = ?', [ibUID]);

          if (proResults.length < 1) {
            // No profile found, resolve with error message.
            return {
              success: false,
              message: `:[[ :WARNO: 404: no-profile-found: MIA: for-the: [[ user: ${ibSelectedUser}: is-with: wind: is-with: code-checkpoint-reached: 0x0da7e94d: ]]: ]]:`
            };
          }

          const ibIBP = proResults.ibp ||= '';
          const ibPro = proResults.pro ||= '';
          const ibLocation = proResults.location ||= '';
          const ibServices = proResults.services ||= '';
          const ibWebsite = proResults.website ||= '';
          const ibGitHub = proResults.github ||= '';

          if (ibGitHub) {
            selectedUserAuthResponseBottom = `
  </div>
  <div id="profile-section">
    <p><strong>:[[ :<a target="_blank" rel="noopener" href="https://github.com/${ibGitHub}">${ibUser}</a>: ☑️: ]]:</strong></p>
    <p class="paragraph"><em>${ibIBP}</em></p>
    <p class="description">${ibPro}</p>
    <p class="description">${ibServices}</p>
    <p class="description">${ibLocation}</p>
    <p><a target="_blank" rel="noopener" href="${ibWebsite}">${ibWebsite}</a></p>
  </div>
</div>
</body>

</html>`;
          } else {
            selectedUserAuthResponseBottom = `
    </div>
    <div id="profile-section">
      <p><strong>:[[ :${ibUser}: ❌: ]]:</strong></p>
      <p class="paragraph"><em>${ibIBP}</em></p>
      <p class="description">${ibPro}</p>
      <p class="description">${ibServices}</p>
      <p class="description">${ibLocation}</p>
      <p><a target="_blank" rel="noopener" href="${ibWebsite}">${ibWebsite}</a></p>
    </div>
  </div>
</body>

</html>`;
          }

          selectedUserAuthResponse = selectedUserAuthResponseTop + selectedUserPostsResponseContent + selectedUserAuthResponseBottom;
          resolve(selectedUserAuthResponse);
        })
        .catch(error => {
          return h.response(`Internal Server Error: ${error}: code-checkpoint-reached: 0xc75a992e:`).code(500);
        });
      }
    });
  });

}

async function generateSelectedUserResponse(request, h, ibSelectedUser) {
  return new Promise(async (resolve, reject) => {
    const domain = ibc.ibDomain;
    const ibSelectedUserID = (await selectUID(ibSelectedUser)).id;
    const ibPostResultsMaximum = 200;
    let selectedUserResponseTop = '';
    let selectedUserPostsResponseContent = '';
    let selectedUserResponseBottom = '';
    let selectedUserResponse = '';
    selectedUserResponseTop = `<!DOCTYPE html>
    <html lang="en-US">
    
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" type="text/css" href="/css/is-by.css">
        <script src="/js/is-by_user.js" type="text/javascript"></script>
        <title>:[[ :is-by: pro: ${ibSelectedUser}: ]]:</title>
    </head>
    
    <body>
        <div id="main-section">
          <div id="media-section">
            <div>
            <img src="/images/Death_Angel-555x111.png" alt=":Death_Angel-555x111.png:" width="555"
                height="111">
            </div>`;
    // CREATE TABLE isby.post (id varchar(64), postid varchar(64), forthe varchar(1024), isby varchar(1024), iswith varchar(1024), timestamp varchar(32));
    let ibPostID = '';
    let ibPostForThe = '';
    let ibPostIsBy = '';
    let ibPostIsWith = '';
    let ibPostTimestamp = '';
    let ibPostResults = [];
    let ibPostResultsLength = 0;
    new Promise((resolve, reject) => {
      pool.query('SELECT postid, forthe, isby, iswith, timestamp FROM post WHERE id = ? LIMIT ?', [ibSelectedUserID, ibPostResultsMaximum], function(error, results, fields) {
        if (error) return reject(error);
        ibPostResults = results;
        ibPostResultsLength = ibPostResults.length - 1;
        selectedUserPostsResponseContent += `<div class="notice"><p><em>:[[ :for-the: [[ posts: is-by: ${ibPostResultsLength}: is-with: showing-latest-results: truncated: is-by: ${ibPostResultsMaximum} ]]: ]]:</em></p></div>`;
        // Post display algorithm:
        for (let i = ibPostResultsLength; i > 0; i--) {
          const ibPostRow = ibPostResults[i];
          ibPostID = ibPostRow.postid;
          ibPostForThe = ibPostRow.forthe;
          ibPostIsBy = ibPostRow.isby;
          ibPostIsWith = ibPostRow.iswith;
          ibPostTimestamp = ibPostRow.timestamp;
    
          selectedUserPostsResponseContent += `
            <div class="post-section">
              <div class="for-the">
                <!-- :[[ :for-the: [[ Δ: { ^ <userid: ${ibSelectedUserID}> ^ }: ]]:= { postid: "${ibPostID}" }: ]]: -->
                <div><span class="heading">:[[ :for-the: [[ ${ibPostForThe}: ]]: ]]:</span></div>
              </div>
              <div class="is-by">
                <div><span class="paragraph">:[[ :is-by: ${ibPostIsBy}: ]]:</span></div>
              </div>
              <div class="is-with">
                <div><span class="description">:is-with: ${ibPostIsWith}: <a class="post-link" href="${ibPostID}">:[[ :post-link: ]]:</a> <a class="select-user" href="${ibSelectedUser}">${ibSelectedUser}</a>: ${ibPostTimestamp}:</span></div>
              </div>
            </div>`;
        }
        resolve(selectedUserPostsResponseContent);
      });
    })
    .then(selectedUserPostsResponseContent => {
      const proResults = pool.query('SELECT ibp, pro, location, services, website, github FROM pro WHERE id = ?', [ibSelectedUserID]);

      if (proResults.length < 1) {
        // No profile found, resolve with error message.
        return {
          success: false,
          message: `:[[ :WARNO: 404: no-profile-found: MIA: for-the: [[ user: ${ibSelectedUser}: is-with: wind: is-with: code-checkpoint-reached: 0x07c9d9d4: ]]: ]]:`
        };
      }

      const ibIBP = proResults.ibp ||= '';
      const ibPro = proResults.pro ||= '';
      const ibLocation = proResults.location ||= '';
      const ibServices = proResults.services ||= '';
      const ibWebsite = proResults.website ||= '';
      const ibGitHub = proResults.github ||= '';

      if (ibGitHub) {
        selectedUserResponseBottom = `
      </div>
      <div id="profile-section">
        <p><strong>:[[ :<a target="_blank" rel="noopener" href="https://github.com/${ibGitHub}">${ibSelectedUser}</a>: ☑️: ]]:</strong></p>
        <p class="paragraph"><em>${ibIBP}</em></p>
        <p class="description">${ibPro}</p>
        <p class="description">${ibServices}</p>
        <p class="description">${ibLocation}</p>
        <p><a target="_blank" rel="noopener" href="${ibWebsite}">${ibWebsite}</a></p>
        <div class="pro-login-section">
        <form id="login" action="https://${domain}/v1/identity" method="POST">
          <input type="text" placeholder="Username" name="username"  autocomplete="username" required>
          <input type="password" placeholder="Password" name="password" autocomplete="current-password" required>
          <input type="submit" value="Login">
          <p id="login-message"></p>
        </form>
      </div>
      <div class="pro-signup-section">
          <form id="signup" action="https://${domain}/v1/signup" method="POST">
            <input type="text" placeholder="Username" name="username" autocomplete="username" required>
            <input type="password" placeholder="Password" name="password" autocomplete="new-password" required>
            <input type="submit" value="Signup">
            <p id="signup-message"></p>
          </form>
        </div>
      </div>
      </div>
    </div>
    </body>
    
    </html>`;
      } else {
        selectedUserResponseBottom = `
        </div>
        <div id="profile-section">
          <p><strong>:[[ :${ibSelectedUser}: ❌: ]]:</strong></p>
          <p class="paragraph"><em>${ibIBP}</em></p>
          <p class="description">${ibPro}</p>
          <p class="description">${ibServices}</p>
          <p class="description">${ibLocation}</p>
          <p><a target="_blank" rel="noopener" href="${ibWebsite}">${ibWebsite}</a></p>
          <div class="pro-login-section">
          <form id="login" action="https://${domain}/v1/identity" method="POST">
            <input type="text" placeholder="Username" name="username"  autocomplete="username" required>
            <input type="password" placeholder="Password" name="password" autocomplete="current-password" required>
            <input type="submit" value="Login">
            <p id="login-message"></p>
          </form>
        </div>
        <div class="pro-signup-section">
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

      selectedUserResponse = selectedUserResponseTop + selectedUserPostsResponseContent + selectedUserResponseBottom;
      resolve(selectedUserResponse);
    })
    .catch(error => {
      return h.response(`Internal Server Error: ${error}: code-checkpoint-reached: 0xc75a992e:`).code(500);
    });
  });

}

async function generatePost(request, h, ibUID, ibAuthToken, ibPostForThe, ibPostIsBy, ibPostIsWith) {
  return new Promise(async (resolve, reject) => {
    const ibUsername = await selectUser(ibUID);
    let ibNewPostForThe = '';
    let ibNewPostIsBy = '';
    let ibNewPostIsWith = '';

    if (ibPostForThe !== undefined) {
      const ibNewPostCrypTEXForThe = ibPostForThe.replaceAll(/ /g, '-').replaceAll(/:-/g, ': ').replaceAll(/\[\[-/g, '[[ ');
      ibNewPostForThe = escapeHTML(ibNewPostCrypTEXForThe);
    }
    if (ibPostIsBy !== undefined) {
      const ibNewPostCrypTEXIsBy = ibPostIsBy.replaceAll(/ /g, '-').replaceAll(/:-/g, ': ').replaceAll(/\[\[-/g, '[[ ');
      ibNewPostIsBy = escapeHTML(ibNewPostCrypTEXIsBy);
    }
    if (ibPostIsWith !== undefined) {
      const ibNewPostCrypTEXIsWith = ibPostIsWith.replaceAll(/ /g, '-').replaceAll(/:-/g, ': ').replaceAll(/\[\[-/g, '[[ ');
      ibNewPostIsWith = escapeHTML(ibNewPostCrypTEXIsWith);
      ibNewPostIsWith = convertUrlsToLinks(ibNewPostIsWith);
    }

    if (ibNewPostForThe.length > 1024) { ibNewPostForThe = ibNewPostForThe.substring(0, 1023); }
    if (ibNewPostIsBy.length > 1024) { ibNewPostIsBy = ibNewPostIsBy.substring(0, 1023); }
    if (ibNewPostIsWith.length > 1024) { ibNewPostIsWith = ibNewPostIsWith.substring(0, 1023); }

    if (authenticateUser(ibUID, ibAuthToken) === null) {
      resolve({
        success: false,
        message: ':[[ :WARNO: unauthorized: ]]:'
      });
    } else {
      const ibPostTimestamp = new Date().toUTCString();
      const ibPostID = crypto.createHash('sha256').update(ibNewPostForThe + ibNewPostIsBy + ibNewPostIsWith + ibPostTimestamp).digest('hex');
      pool.query('INSERT INTO post (id, postid, forthe, isby, iswith, timestamp) VALUES (?, ?, ?, ?, ?, ?)', [ibUID, ibPostID, ibNewPostForThe, ibNewPostIsBy, ibNewPostIsWith, ibPostTimestamp], function (error, addPostResults, fields) {
        if (error) reject(error);
        const response = h.response({
          success: true,
          message: ':[[ :SUCCESS: post-added: ]]:'
        });

        response.header('ib-username', ibUsername);

        resolve(response);
      });
    }
  });
}

async function generateDefaultResponse() {
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
