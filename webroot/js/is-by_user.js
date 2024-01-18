const domain = 'is-by.pro';

document.addEventListener('DOMContentLoaded', (event) => {
  attachLoginFormEventListener();
  attachSignupFormEventListener();
});

function attachEventListeners() {
  attachNewPostEventListener();
  attachSelectUserEventListener();
  attachSelectPostEventListener();
  attachProHomeEventListener();
  attachEditPostEventListener();
  attachDeletePostEventListener();
  attachShowEditProEventListener();
  attachEditProEventListener();
}

function attachSignupFormEventListener() {
  const ibSignupForm = document.querySelector('#signup');

  ibSignupForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const ibUsername = ibSignupForm.querySelector('input[name="username"]').value;
    const ibPassword = ibSignupForm.querySelector('input[name="password"]').value;

    fetch(ibSignupForm.action, {
      method: ibSignupForm.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/html'
      },
      body: JSON.stringify({ 'username': ibUsername, 'password': ibPassword })
    })
    .then(async response => await response.json())
    .then(data => {
      if (data.success === true) {
        return generateIBFormMessageSuccess('signup-message', data.message);
      } else {
        return generateIBFormMessageFailure('signup-message', data.message);
      }
  })
  .catch(error => generateIBFormMessageFailure('signup-message', error));
  });
}

function attachLoginFormEventListener() {
  const ibLoginForm = document.querySelector('#login');

  ibLoginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const ibUsername = ibLoginForm.querySelector('input[name="username"]').value;
    const ibPassword = ibLoginForm.querySelector('input[name="password"]').value;
    let ibUID = '';
    let ibAuthToken = '';

    fetch(ibLoginForm.action, {
      method: ibLoginForm.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/html'
      },
      body: JSON.stringify({ 'username': ibUsername, 'password': ibPassword })
    })
      .then(response => {
        ibUID = response.headers.get('ib-uid');
        ibAuthToken = response.headers.get('ib-authtoken');
        if (response.ok) {
          return response.json();
        }
      })
      .then(data => {
        if (data.success === true) {
          generateIBFormMessageSuccess('login-message', data.message);
          console.log('ibUsername:', ibUsername);
          console.log('ibUID:', ibUID);
          console.log('ibAuthToken:', ibAuthToken);
          generateIBLoginFormSuccess(ibUsername, ibUID, ibAuthToken);
        }
        if (data.success === false) {
          generateIBFormMessageFailure('login-message', data.message);
        }
      })
      .catch(error => console.log(`:[[ :${error}: ]]:`))
  });
}

function attachSelectUserEventListener() {
  const selectUserLinks = document.querySelectorAll('.select-user');
  const selectUserForm = document.getElementById('select-user-form');
  const ibUID = selectUserForm.querySelector('input[name="ibuid"]').value;
  const ibAuthToken = selectUserForm.querySelector('input[name="ibauthtoken"]').value;

  selectUserLinks.forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      const url = new URL(link.href);
      const path = url.pathname.substring(1);
  
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/html',
        'ib-uid': ibUID,
        'ib-authtoken': ibAuthToken,
        'ib-selecteduser': path
      };
  
      try {
        const params = new URLSearchParams({
          'ibuid': ibUID,
          'ibauthtoken': ibAuthToken,
          'ibselecteduser': path
        });
      
        const response = await fetch(`${selectUserForm.action}?${params.toString()}`, {
          method: 'GET',
          headers: headers
        });
      
        const data = await response.text();
        generateIBFormSuccess(data);
      } catch (error) {
        console.log('select-user-message:', error);
        console.error('select-user-message:', error);
      }
    });
  });
}

function attachNewPostEventListener() {
  const links = document.querySelectorAll('a.post-form-display');
  const postFormSection = document.getElementById('post-form-section');

  characterCounter('post-character-count');

  for (let link of links) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      postFormSection.style.display = 'block'; // display the form section
    });
  }

  const cancelButton = document.getElementById('post-cancel');

  cancelButton.addEventListener('click', (event) => {
    postFormSection.style.display = 'none'; // hide the form section
  });

  const ibPostForm = document.querySelector('#post');

  ibPostForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const ibUID = ibPostForm.querySelector('input[name="ibuid"]').value;
    const ibAuthToken = ibPostForm.querySelector('input[name="ibauthtoken"]').value;
    const forThe = ibPostForm.querySelector('input[name="forthe"]').value;
    const isBy = ibPostForm.querySelector('input[name="isby"]').value;
    const isWith = ibPostForm.querySelector('input[name="iswith"]').value;

    fetch(ibPostForm.action, {
      method: ibPostForm.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/html',
        'ib-uid': ibUID,
        'ib-authtoken': ibAuthToken
      },
      body: JSON.stringify({ 'ibuid': ibUID, 'ibauthtoken': ibAuthToken, 'forthe': forThe, 'isby': isBy, 'iswith': isWith }),
    })
      .then(async response => {
        for (let [key, value] of response.headers.entries()) {
          console.log(`${key}: ${value}`);
        }

        await response.text();
      })
      .then(data => generateIBFormSuccess(data))
      .catch(error => generateIBFormMessageFailure('new-post-message', error))
  });

}

function attachSelectPostEventListener() {
  const selectPostLinks = document.querySelectorAll('.post-link');
  const selectPostForm = document.getElementById('select-post-form');
  const ibUID = selectPostForm.querySelector('input[name="ibuid"]').value;
  const ibAuthToken = selectPostForm.querySelector('input[name="ibauthtoken"]').value;
  const ibSelectedUser = selectPostForm.querySelector('input[name="ibselecteduser"]').value;

  selectPostLinks.forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      const url = new URL(link.href);
      const path = url.pathname.substring(1);

      console.log('Selected Post:', path);
  
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/html',
        'ib-uid': ibUID,
        'ib-authtoken': ibAuthToken,
        'ib-selecteduser': ibSelectedUser,
        'ib-showpostid': path
      };
  
      try {
        const params = new URLSearchParams({
          'ibuid': ibUID,
          'ibauthtoken': ibAuthToken,
          'ibselecteduser': ibSelectedUser,
          'pid': path
        });
      
        const response = await fetch(`${selectPostForm.action}?${params.toString()}`, {
          method: 'GET',
          headers: headers
        });
      
        const data = await response.text();
        generateIBFormSuccess(data);
        const copyPasteLinks = document.querySelectorAll('.copy-paste-link');

        copyPasteLinks.forEach((link) => {
          link.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
              await navigator.clipboard.writeText(link.href);
              console.log('Link copied to clipboard');
            } catch (err) {
              console.log('Failed to copy link: ', err);
            }
          });
        });
      
      } catch (error) {
        generateIBFormMessageFailure('select-post-message', error);
        console.error('Error:', error);
      }
    });
  });
}

function attachEditPostEventListener() {
  const selectPostLinks = document.querySelectorAll('.edit-post');
  const selectPostForm = document.getElementById('edit-post-form');
  const ibUID = selectPostForm.querySelector('input[name="ibuid"]').value;
  const ibAuthToken = selectPostForm.querySelector('input[name="ibauthtoken"]').value;
  const ibSelectedUser = selectPostForm.querySelector('input[name="ibselecteduser"]').value;

  selectPostLinks.forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      const url = new URL(link.href);
      const path = url.pathname.substring(1);

      console.log('Selected Post:', path);
  
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/html',
        'ib-uid': ibUID,
        'ib-authtoken': ibAuthToken,
        'ib-selecteduser': ibSelectedUser,
        'ib-editpostid': path
      };
  
      try {
        const params = new URLSearchParams({
          'ibuid': ibUID,
          'ibauthtoken': ibAuthToken,
          'ibselecteduser': ibSelectedUser,
          'pid': path
        });
      
        const response = await fetch(`${selectPostForm.action}?${params.toString()}`, {
          method: 'GET',
          headers: headers
        });
      
        const data = await response.text();
        generateIBFormSuccess(data);

        const ibPostForm = document.querySelector('#editpost');

        ibPostForm.addEventListener('submit', (event) => {
          event.preventDefault();

          const ibUID = ibPostForm.querySelector('input[name="ibuid"]').value;
          const ibAuthToken = ibPostForm.querySelector('input[name="ibauthtoken"]').value;
          const forThe = ibPostForm.querySelector('input[name="forthe"]').value;
          const isBy = ibPostForm.querySelector('input[name="isby"]').value;
          const isWith = ibPostForm.querySelector('input[name="iswith"]').value;
          const postID = ibPostForm.querySelector('input[name="pid"]').value;

          fetch(ibPostForm.action, {
            method: ibPostForm.method,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/html',
              'ib-uid': ibUID,
              'ib-authtoken': ibAuthToken,
              'ib-editpostid': postID
            },
            body: JSON.stringify({ 'ibuid': ibUID, 'ibauthtoken': ibAuthToken, 'forthe': forThe, 'isby': isBy, 'iswith': isWith, 'pid': postID }),
          })
            .then(async response => {
              for (let [key, value] of response.headers.entries()) {
                console.log(`${key}: ${value}`);
              }

              await response.text();
            })
            .then(data => generateIBFormSuccess(data))
            .catch(error => generateIBFormMessageFailure('edit-post-message', error))
        });

        attachEventListeners();
      } catch (error) {
        generateIBFormMessageFailure(error);
        console.error('Error:', error);
      }
    });
  });
}

function attachProHomeEventListener() {
  const selectUserLinks = document.querySelectorAll('.pro-home-display');
  const selectUserForm = document.getElementById('select-user-form');
  const ibUID = selectUserForm.querySelector('input[name="ibuid"]').value;
  const ibAuthToken = selectUserForm.querySelector('input[name="ibauthtoken"]').value;

  selectUserLinks.forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      const url = new URL(link.href);
      const path = url.pathname.substring(1);
  
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/html',
        'ib-uid': ibUID,
        'ib-authtoken': ibAuthToken,
        'ib-selecteduser': path
      };
  
      try {
        const params = new URLSearchParams({
          'ibuid': ibUID,
          'ibauthtoken': ibAuthToken,
          'ibselecteduser': path
        });
      
        const response = await fetch(`${selectUserForm.action}?${params.toString()}`, {
          method: 'GET',
          headers: headers
        });
      
        const data = await response.text();
        generateIBFormSuccess(data);
      
      } catch (error) {
        generateIBFormMessageFailure('edit-pro-message', error);
        console.error('Error:', error);
      }
    });
  });
}

function attachDeletePostEventListener() {
  const deletePostLinks = document.querySelectorAll('.delete-post');
  const deletePostForm = document.getElementById('delete-post-form');
  const ibUID = deletePostForm.querySelector('input[name="ibuid"]').value;
  const ibAuthToken = deletePostForm.querySelector('input[name="ibauthtoken"]').value;
  const ibSelectedUser = deletePostForm.querySelector('input[name="ibselecteduser"]').value;

  deletePostLinks.forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      const url = new URL(link.href);
      const path = url.pathname.substring(1);
  
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/html',
        'ib-uid': ibUID,
        'ib-authtoken': ibAuthToken,
        'ib-selecteduser': ibSelectedUser,
        'ib-deletepostid': path
      };
  
      try {
        const body = JSON.stringify({
          'ibuid': ibUID,
          'ibauthtoken': ibAuthToken,
          'ibselecteduser': ibSelectedUser,
          'pid': path
        });
      
        const response = await fetch(deletePostForm.action, {
          method: 'POST',
          headers: headers,
          body: body
        });
      
        const data = await response.text();
        generateIBFormSuccess(data);
      } catch (error) {
        console.error('Error:', error);
        generateIBFormMessageFailure('delete-post-message', error);
      }
    });
  });
}

function attachShowEditProEventListener() {
  const showEditProLinks = document.querySelectorAll('.show-edit-profile');
  const editProForm = document.getElementById('edit-profile-form');
  const ibUID = editProForm.querySelector('input[name="ibuid"]').value;
  const ibAuthToken = editProForm.querySelector('input[name="ibauthtoken"]').value;

  showEditProLinks.forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      const url = new URL(link.href);
      const path = url.pathname.substring(1);
  
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/html',
        'ib-uid': ibUID,
        'ib-authtoken': ibAuthToken
      };
  
      try {
        const body = JSON.stringify({
          'ibuid': ibUID,
          'ibauthtoken': ibAuthToken
        });
      
        const response = await fetch(editProForm.action, {
          method: 'POST',
          headers: headers,
          body: body
        });
      
        const data = await response.text();
        generateIBFormSuccess(data);
      } catch (error) {
        generateIBFormMessageFailure('edit-pro-message', error)
        console.error('Error:', error);
      }
    });
  });
}

function attachEditProEventListener() {
  const ibEditProForm = document.querySelector('#editpro');

  ibEditProForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const ibUID = ibEditProForm.querySelector('input[name="ibuid"]').value;
    const ibAuthToken = ibEditProForm.querySelector('input[name="ibauthtoken"]').value;
    const ibIBP = ibEditProForm.querySelector('input[name="ibibp"]').value;
    const ibLocation = ibEditProForm.querySelector('input[name="iblocation"]').value;
    const ibServices = ibEditProForm.querySelector('input[name="ibservices"]').value;
    const ibWebsite = ibEditProForm.querySelector('input[name="ibwebsite"]').value;
    const ibGitHub = ibEditProForm.querySelector('input[name="ibgithub"]').value;

    fetch(ibEditProForm.action, {
      method: ibEditProForm.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/html',
        'ib-uid': ibUID,
        'ib-authtoken': ibAuthToken
      },
      body: JSON.stringify({ 'ibuid': ibUID, 'ibauthtoken': ibAuthToken, 'ibibp': ibIBP, 'iblocation': ibLocation, 'ibservices': ibServices, 'ibwebsite': ibWebsite, 'ibgithub': ibGitHub })
    })
      .then(async response => {
        for (let [key, value] of response.headers.entries()) {
          console.log(`${key}: ${value}`);
        }

        await response.text();
      })
      .then(data => generateIBFormSuccess(data))
      .catch(error => generateIBFormMessageFailure('edit-pro-message', error))
  });
}

function characterCounter(counter) {
  const textFieldForThe = document.querySelector('input[name="forthe"]');
  const charCountDiv = document.getElementById(`${counter}`);

  textFieldForThe.addEventListener('input', (event) => {
    const charCountForThe = event.target.value.length;
    charCountDiv.textContent = charCountForThe + '/1024';
    if (charCountForThe > 1000) {
      charCountDiv.style.color = 'red';
    } else {
      charCountDiv.style.color = 'green';
    }
  });

  textFieldForThe.addEventListener('focus', () => {
    charCountDiv.textContent = '0/1024';
  });

  // character counter isBy:
  const textFieldIsBy = document.querySelector('input[name="isby"]');

  textFieldIsBy.addEventListener('input', (event) => {
    const charCountIsBy = event.target.value.length;
    charCountDiv.textContent = charCountIsBy + '/1024';
    if (charCountIsBy > 1000) {
      charCountDiv.style.color = 'red';
    } else {
      charCountDiv.style.color = 'green';
    }
  });

  textFieldIsBy.addEventListener('focus', () => {
    charCountDiv.textContent = '0/1024';
  });

  // character counter isWith:
  const textFieldIsWith = document.querySelector('input[name="iswith"]');

  textFieldIsWith.addEventListener('input', (event) => {
    const charCountIsWith = event.target.value.length;
    charCountDiv.textContent = charCountIsWith + '/1024';
    if (charCountIsWith > 1000) {
      charCountDiv.style.color = 'red';
    } else {
      charCountDiv.style.color = 'green';
    }
  });

  textFieldIsWith.addEventListener('focus', () => {
    charCountDiv.textContent = '0/1024';
  });
}

function generateIBFormMessageSuccess(id, content) {
  document.getElementById(`${id}`).innerHTML = `
  <em class="success">${content}</em>`;
}

function generateIBFormMessageFailure(id, content) {
  document.getElementById(`${id}`).innerHTML = `
  <em class="failure">${content}</em>`;
}

function generateIBLoginFormSuccess(ibUser, ibUID, ibAuthToken) {
  const headers = new Headers();
  headers.append('ib-uid', ibUID);
  headers.append('ib-authtoken', ibAuthToken);

  const body = new URLSearchParams();
  body.append('ibuid', ibUID);
  body.append('ibauthtoken', ibAuthToken);

  fetch(`https://${domain}/${ibUser}`, {
    method: 'POST',
    headers: headers,
    body: body
  })
  .then(response => response.text())
  .then(data => {
    // console.log(data);
    generateIBFormSuccess(data);
  })
  .catch(error => {
    console.error('Error:', error);
    // Handle the error...
  });
  attachEventListeners();
}

function generateIBFormSuccess(content) {
  if (content !== undefined) {
    document.documentElement.innerHTML = content;
  }
  attachEventListeners();
}
