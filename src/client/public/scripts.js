function waitLoadDOM(callback) {
  document.addEventListener('DOMContentLoaded', callback());
}

function sendMessage(socket) {
  const form = document.getElementById('form');

  form.addEventListener('submit', event => {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;

    document.getElementById('name').value = '';
    document.getElementById('email').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('message').value = '';

    socket.send(JSON.stringify({ name, email, phone, message }));
  });
}

function websocketHandler() {
  const socket = new WebSocket('_SERVER_URL_');

  socket.onopen = () => {
    console.info('Connected');

    waitLoadDOM(() => {
      sendMessage(socket);
    });
  };

  socket.onmessage = message => {
    console.log('message', message);
  };

  socket.onerror = error => console.error(`WebSocket error:`, error);
  socket.onclose = () => console.info('Disconnected from WebSocket server');
}

websocketHandler();
