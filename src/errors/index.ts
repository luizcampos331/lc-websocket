function errors() {
  ['uncaughtException', 'unhandledRejection'].forEach(event =>
    process.on(event, err => {
      console.error(
        `Something bad happened! event: ${event}, msg: ${err.stack || err}`,
      );
    }),
  );
}

export default errors;
