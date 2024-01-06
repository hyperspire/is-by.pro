document.addEventListener('DOMContentLoaded', (event) => {
  const form = document.querySelector('#signup');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }

    fetch(form.action, {
      method: form.method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
      if (data.message === ":[[ :SUCCESS: user-authorized: ]]:") {
        return generateIBSignupSuccess(data.message);
      } else {
        return generateIBSignupFailure(data.message);
      }
  })
  .catch(error => generateIBSignupFailure('Error:', error));
  });
});

function generateIBSignupSuccess(message) {
  return document.querySelector('#signup-message').innerHTML = `
        <em class="success">${message}</em>`;
}

function generateIBSignupFailure(message) {
  return document.querySelector('#signup-message').innerHTML = `
        <em class="warno">${message}</em>`;
}