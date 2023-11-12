function websocketHandler() {
  const socket = new WebSocket('_SERVER_URL_');

  // const messages = document.getElementById('messages');

  // socket.onmessage = message => (messages.innerHTML += message.data);
  socket.onopen = event => console.info('Connected', event);
  socket.onmessage = message => console.log('message', message);
  socket.onerror = error => console.error(`WebSocket error:`, error);
  socket.onclose = () => console.info('Disconnected from WebSocket server');
}

websocketHandler();
