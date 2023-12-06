let socket;

function waitLoadDOM(callback) {
  document.addEventListener('DOMContentLoaded', callback());
}

function sendMessage() {
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

function receiveMessage(message, messages) {
  try {
    const formattedMessage = JSON.stringify(JSON.parse(message), null, 2);

    if (!messages.innerHTML.includes('[')) {
      const formattedString = `[\n  ${formattedMessage.replace(
        /\n/g,
        '\n  ',
      )}\n]`;
      messages.innerHTML = `<pre>${formattedString}</pre>`;
    } else {
      const currentContent = messages.textContent;
      const lastIndex = currentContent.lastIndexOf(']');

      const contentWithoutLastComma = currentContent
        .slice(0, lastIndex)
        .trimEnd();

      const newContent = `${contentWithoutLastComma},\n  ${formattedMessage.replace(
        /\n/g,
        '\n  ',
      )}\n]`;
      messages.innerHTML = `<pre>${newContent}</pre>`;
    }

    return '';
  } catch (error) {
    return message;
  }
}

function connectServer() {
  socket = new WebSocket('_SERVER_URL_');
}

function reconnectServer() {
  connectServer();

  socket.onerror = error => {
    console.error('WebSocket error during reconnection:', error);
    setTimeout(reconnectServer, 3000);
  };

  socket.onopen = () => {
    console.info('WebSocket server is reconnected');

    listeners();
  };
}

function listeners() {
  socket.onopen = () => {
    console.info('WebSocket server is connected');

    waitLoadDOM(() => {
      sendMessage(socket);
    });
  };

  const messages = document.getElementById('messages');

  let chunkMessage = '';

  socket.onmessage = message => {
    if (chunkMessage) {
      chunkMessage = receiveMessage(chunkMessage + message.data, messages);
    } else {
      chunkMessage = receiveMessage(message.data, messages);
    }
  };

  socket.onerror = error => console.error(`WebSocket server error:`, error);

  socket.onclose = () => {
    console.info('Disconnected from WebSocket server');

    reconnectServer();
  };
}

function webSocketHandler() {
  connectServer();
  listeners();
}

webSocketHandler();
