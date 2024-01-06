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

      return generateIBProSignup(username, password);
    }
  });

  server.route({
    method: 'POST',
    path: '/v1/identity',
    handler: async function (request, h) {
      const username = request.payload.username;
      const password = encrypt(request.payload.password);

      return generateIBProIdentity(username, password);
    }
  });

  server.route({
    method: 'POST',
    path: '/{param*}',
    handler: async function (request, h) {
      const ibUID = request.headers['ib-uid'] ||= request.payload.ibsid;
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
    handler: {
      directory: {
        path: path.join(__dirname, 'webroot/images'),
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/robots.txt',
    handler: {
      directory: {
        path: path.join(__dirname, 'webroot'),
      }
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

async function generateIBProSignup(username, password) {
  const specialCharRegex = /\W/;

  return new Promise((resolve, reject) => {
    pool.query('SELECT user FROM user WHERE user = ?', [username], function (error, checkUserResults, fields) {
      if (error) reject(error);

      if (checkUserResults.length > 0) {
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
        pool.query('INSERT INTO user (user, secureid) VALUES (?, ?)', [username, password], function (error, addUserResults, fields) {
          if (error) reject(error);
          resolve({
            success: true,
            message: ':[[ :SUCCESS: user-authorized: ]]:'
          });
        });
      }
    });
  });
}

async function generateIBProIdentity(username, password) {

  return new Promise((resolve, reject) => {
    pool.query('SELECT user FROM user WHERE user = ? AND secureid = ?', [username, password], function (error, authUserResults, fields) {
      if (error) reject(error);

      if (authUserResults.length < 1) {
        resolve({
          success: false,
          message: ':[[ :WARNO: unauthorized: ]]:'
        });
      } else {
        const ibUID = crypto.createHash('sha256').update(username.toLowerCase()).digest('hex');
        const remoteAddress = request.info.remoteAddress;
        const userAgent = request.headers['user-agent'];
        const httpDate = new Date().toUTCString();
        const ibAuthToken = encrypt(ibUID + username + password + remoteAddress + userAgent + httpDate);

        pool.query('UPDATE user SET authtoken = ? WHERE user = ? AND secureid = ?', [ibAuthToken, username, password], function (error, authTokenResults, fields) {
          if (error) reject(error);

          const response = h.response({
            success: true,
            message: ':[[ :SUCCESS: user-authorized: ]]:'
          });

          response.header('ib-uid', ibUID);
          response.header('ib-authtoken', ibAuthToken);

          resolve(response);
        });
      }
    });
  });
}

async function generateIBProSelectedUserResponse(ibUID, ibAuthToken, ibSelectedUser) {
  return new Promise((resolve, reject) => {
    if (ibUID && ibAuthToken && ibSelectedUser) {
      pool.query('SELECT authtoken FROM user WHERE id = ?', [ibUID], function (error, authTokenResults, fields) {
        if (error) reject(error);

        if (authTokenResults.length < 1) {
          // No valid AuthToken found, generate default response.
          resolve(generateIBProDefaultResponse());
        } else {
          // Valid AuthToken found, generate authenticated content.
          const selectedUserAuthResponseTop = await generateIBProAuthResponseTop(ibUID, ibAuthToken, ibSelectedUser);
          // Does not matter if user is authenticated or not, generate selected user content;
          // since we are not fascists that require everyone to be logged in to view our content
          // so we can track them and sell their data to the highest bidder or use it as
          // circumstantial evidence in the ATSU unknown competitor projects. In fact, we do
          // not even use cookies or generate logs, we use a custom identity service and encrypted AuthTokens instead.
          const selectedUserIBPostsResponseContent = await generateIBPostsResponseContent(ibUID, ibAuthToken, ibSelectedUser);
          const selectedUserAuthResponseBottom = await generateIBProAuthResponseBottom(ibUID, ibAuthToken, ibSelectedUser);
          const selectedUserAuthResponse = selectedUserAuthResponseTop + selectedUserIBPostsResponseContent + selectedUserAuthResponseBottom;
          resolve(selectedUserAuthResponse);
        }
      });
    } else {
      if (ibSelectedUser) {
        // User selected, generate selected user content.
        const selectedUserDefaultResponseTop = await generateIBProDefaultResponseTop(ibSelectedUser);
        const selectedUserIBPostsResponseContent = await generateIBPostsResponseContent(ibSelectedUser);
        const selectedUserDefaultResponseBottom = await generateIBProDefaultResponseBottom(ibSelectedUser);
        const selectedUserDefaultResponse = selectedUserDefaultResponseTop + selectedUserIBPostsResponseContent + selectedUserDefaultResponseBottom;
        resolve(selectedUserDefaultResponse);
      } else {
        // No user selected, generate default response.
        resolve(generateIBProDefaultResponse());
      }
    }
  });
}

async function generateIBProAuthResponseTop(ibUID, ibAuthToken, ibSelectedUser) {
  const domain = ibc.ibDomain;
  // CREATE TABLE isby.user (id varchar(64), user varchar(128), secureid varchar(128), lastlog varchar(32), authtoken varchar(1024));
  let ibUser = '';
  pool.query('SELECT user FROM user WHERE id = ?', [ibUID], function (error, userResults, fields) {
    if (error) reject(error);
    if (userResults.length < 1) {
      // No valid user found, resolve with error message.
      resolve({
        success: false,
        message: ':[[ :WARNO: no-valid-user-found: code-checkpoint-reached: 0x62ee37bf: ]]:'
      });
    } else {
      ibUser = userResults[0].user;
    }
  });

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
}

async function generateIBPostsResponseContent(ibUID, ibAuthToken, ibSelectedUser) {
  // Generate posts content for selected user.
  
  const ibSelectedUserID = crypto.createHash('sha256').update(ibSelectedUser.toLowerCase()).digest('hex');
  // CREATE TABLE isby.user (id varchar(64), user varchar(128), secureid varchar(128), lastlog varchar(32), authtoken varchar(1024));
  let ibUser = '';
  pool.query('SELECT user FROM user WHERE id = ?', [ibUID], function (error, userResults, fields) {
    if (error) reject(error);
    if (userResults.length < 1) {
      // No valid user found, resolve with error message.
      resolve({
        success: false,
        message: ':[[ :WARNO: no-valid-user-found: code-checkpoint-reached: 0x1ff50120: ]]:'
      });
    } else {
      ibUser = userResults[0].user;
    }
  });

  let ibPosts = '';
  let ibPostID = '';
  let ibPostForThe = '';
  let ibPostIsBy = '';
  let ibPostIsWith = '';
  let ibPostTimestamp = '';

  pool.query('SELECT postid, forthe, isby, iswith, timestamp FROM post WHERE id = ?', [ibSelectedUserID], function (error, ibPostResults, fields) {
    if (error) reject(error);

    const ibPostResultsLength = ibPostResults.length;
    const ibPostResultsMaximum = 200;

    ibPosts = `<div class="notice"><p><em>:[[ :for-the: [[ posts: is-by: ${ibPostResultsLength}: is-with: showing-latest-results: truncated: is-by: ${ibPostResultsLengthMax} ]]: ]]:</em></p></div>`;

    // Post display algorithm, limited by ibPostResultsMaximum.
    if (ibPostResultsLength >= ibPostResultsLengthMax) {
      for (let i = ibPostResultsLength - 1; i >= ibPostResultsLengthMax; i--) {
        const ibPostRow = ibPostResults[i];
        ibPostID = ibPostRow.postid ||= '';
        ibPostForThe = ibPostRow.forthe ||= '';
        ibPostIsBy = ibPostRow.isby ||= '';
        ibPostIsWith = ibPostRow.iswith ||= '';
        ibPostTimestamp = ibPostRow.timestamp ||= '';
        
        ibPosts += generateIBPosts(ibUID, ibAuthToken, ibSelectedUser, ibPostID, ibPostForThe, ibPostIsBy, ibPostIsWith, ibPostTimestamp);
      }
    } else {

      for (let i = ibPostResultsLength - 1; i >= 0; i--) {
        const ibPostRow = ibPostResults[i];
        ibPostID = ibPostRow.postid ||= '';
        ibPostForThe = ibPostRow.forthe ||= '';
        ibPostIsBy = ibPostRow.isby ||= '';
        ibPostIsWith = ibPostRow.iswith ||= '';
        ibPostTimestamp = ibPostRow.timestamp ||= '';

        ibPosts += generateIBPosts(ibUID, ibAuthToken, ibSelectedUser, ibPostID, ibPostForThe, ibPostIsBy, ibPostIsWith, ibPostTimestamp);
      }
    }

  return ibPosts;
}

function generateIBPosts(ibUID, ibAuthToken, ibSelectedUser, postid, forthe, isby, iswith, timestamp) {
  const ibSelectedUserID = crypto.createHash('sha256').update(ibSelectedUser.toLowerCase()).digest('hex');
  // CREATE TABLE isby.user (id varchar(64), user varchar(128), secureid varchar(128), lastlog varchar(32), authtoken varchar(1024));
  let ibUser = '';
  pool.query('SELECT user FROM user WHERE id = ?', [ibUID], function (error, userResults, fields) {
    if (error) reject(error);
    if (userResults.length < 1) {
      // No valid user found, resolve with error message.
      resolve({
        success: false,
        message: ':[[ :WARNO: no-valid-user-found: code-checkpoint-reached: 0x1ff50120: ]]:'
      });
    } else {
      ibUser = userResults[0].user;
    }
  });

  if (ibAuthToken) {
    if (ibUID === ibSelectedUserID) {
      // Logged in user is the selected user, show edit and delete menu options.
      return `
        <div class="post-section">
          <div class="for-the">
            <!-- :[[ :for-the: [[ Δ: { ^ <userid: ${ibUID}> ^ }: ]]:= { postid: "${postid}" }: ]]: -->
            <div><span class="heading">:[[ :for-the: [[ ${forthe}: ]]: ]]:</span></div>
          </div>
          <div class="is-by">
            <div><span class="paragraph">:[[ :is-by: ${isby}: ]]:</span></div>
          </div>
          <div class="is-with">
            <div><span class="description">:is-with: ${iswith}: <a class="select-user" href="${ibUser}">${ibUser}</a>: ${timestamp}</span></div><br>
            <div><span class="description"><a class="post-link" href="${postid}">:[[ :post-link: ]]:</a> <a class="edit-post" href="${postid}">:[[ :edit: ]]: </a> <a class="delete-post" href="${postid}">:[[ :delete: ]]:</a></span></div>
          </div>
        </div>`;
    } else {
      // Logged in user is not the selected user, do not show edit and delete menu options.
      return `
        <div class="post-section">
          <div class="for-the">
            <!-- :[[ :for-the: [[ Δ: { ^ <userid: ${ibUID}> ^ }: ]]:= { postid: "${postid}" }: ]]: -->
            <div><span class="heading">:[[ :for-the: [[ ${forthe}: ]]: ]]:</span></div>
          </div>
          <div class="is-by">
            <div><span class="paragraph">:[[ :is-by: ${isby}: ]]:</span></div>
          </div>
          <div class="is-with">
            <div><span class="description">:is-with: ${iswith}: <a class="post-link" href="${postid}">:[[ :post-link: ]]:</a> <a class="select-user" href="${selectedUser}">${selectedUser}</a>: ${timestamp}:</span></div>
          </div>
        </div>`;
    }
  } else {
    // No AuthToken, client is an unauthenticated web lurker.
    return `
        <div class="post-section">
          <div class="for-the">
            <!-- :[[ :for-the: [[ Δ: { ^ <userid: ${ibUID}> ^ }: ]]:= { postid: "${postid}" }: ]]: -->
            <div><span class="heading">:[[ :for-the: [[ ${forthe}: ]]: ]]:</span></div>
          </div>
          <div class="is-by">
            <div><span class="paragraph">:[[ :is-by: ${isby}: ]]:</span></div>
          </div>
          <div class="is-with">
            <div><span class="description">:is-with: ${iswith}: <a class="post-link" href="${postid}">:[[ :post-link: ]]:</a> <a class="select-user" href="${selectedUser}">${selectedUser}</a>: ${timestamp}:</span></div>
          </div>
        </div>`;
  }
}

async function generateIBProAuthResponseBottom(ibUID, ibAuthToken, ibSelectedUser) {
  // CREATE TABLE isby.user (id varchar(64), user varchar(128), secureid varchar(128), lastlog varchar(32), authtoken varchar(1024));
  let ibUser = '';
  pool.query('SELECT user FROM user WHERE id = ?', [ibUID], function (error, userResults, fields) {
    if (error) reject(error);
    if (userResults.length < 1) {
      // No valid user found, resolve with error message.
      resolve({
        success: false,
        message: ':[[ :WARNO: no-valid-user-found: code-checkpoint-reached: 0x1ff50120: ]]:'
      });
    } else {
      ibUser = userResults[0].user;
    }
  });

  // CREATE TABLE isby.pro (id varchar(64), ibp varchar(256), pro varchar(128), location varchar(128), services varchar(256), website varchar(512), github varchar(128));
  let ibIBP: string = '';
  let ibPro: string = '';
  let ibLocation: string = '';
  let ibServices: string = '';
  let ibWebsite: string = '';
  let ibGitHub: string = '';
  pool.query('SELECT ibp, pro, location, services, website, github FROM pro WHERE id = ?', [ibUID], function (error, proResults, fields) {
    if (error) reject(error);
    if (proResults.length < 1) {
      // No profile found, resolve with error message.
      resolve({
        success: false,
        message: ':[[ :WARNO: 404: no-profile-found: MIA: for-the: [[ user: is-with: wind: code-checkpoint-reached: 0x0da7e94d: ]]: ]]:'
      });
    } else {
      ibIBP = ibProResults[0].ibp ||= '';
      ibPro = ibProResults[0].pro ||= '';
      ibLocation = ibProResults[0].location ||= '';
      ibServices = ibProResults[0].services ||= '';
      ibWebsite = ibProResults[0].website ||= '';
      ibGitHub = ibProResults[0].github ||= '';
    }
  });

  if (ibGitHub) {
    return `
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
      return `
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

async function generateIBProDefaultResponseTop(ibSelectedUser) {
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
          <img src="/images/Death_Angel-555x111.png" alt=":Death_Angel-555x111.png:" width="555"
              height="111">
  `;
}

async function generateIBProDefaultResponseBottom(ibSelectedUser) {
  const domain = ibc.ibDomain;
  const ibUID = crypto.createHash('sha256').update(ibSelectedUser.toLowerCase()).digest('hex');

  // CREATE TABLE isby.pro (id varchar(64), ibp varchar(256), pro varchar(128), location varchar(128), services varchar(256), website varchar(512), github varchar(128));
  let ibIBP: string = '';
  let ibPro: string = '';
  let ibLocation: string = '';
  let ibServices: string = '';
  let ibWebsite: string = '';
  let ibGitHub: string = '';
  pool.query('SELECT ibp, pro, location, services, website, github FROM pro WHERE id = ?', [ibUID], function (error, proResults, fields) {
    if (error) reject(error);
    if (proResults.length < 1) {
      // No profile found, resolve with error message.
      resolve({
        success: false,
        message: ':[[ :WARNO: 404: no-profile-found: MIA: for-the: [[ user: is-with: wind: code-checkpoint-reached: 0x8f0dbd05: ]]: ]]:'
      });
    } else {
      ibIBP = ibProResults[0].ibp ||= '';
      ibPro = ibProResults[0].pro ||= '';
      ibLocation = ibProResults[0].location ||= '';
      ibServices = ibProResults[0].services ||= '';
      ibWebsite = ibProResults[0].website ||= '';
      ibGitHub = ibProResults[0].github ||= '';
    }
  });

  if (ibGitHub) {
    return `
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
</body>

</html>`;
  } else {
  return `
  <div id="pro-profile-section">
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
            
</body>

</html>`;
  }
}

async function generateIBProDefaultResponse() {
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