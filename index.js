const express = require('express');
const port = 3000;
const catalog = require('./src/catalog');
const db = require('./src/db/db');
const config = require('./src/config/config');

var app = express();
const server = app.listen(port);

const io = require('socket.io').listen(server);

const main = async() => {
  app.use(function(request, response, next) {
    response.header('Access-Control-Allow-Origin', 'http://localhost:8080');
    response.header('Access-Control-Allow-Credentials', 'true');
    response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  server.listen(port, () => {
      console.log(`Serving on port ${port}`);
  });
  io.on('connection', function(socket) {
    console.log('User connected');
    io.on('disconnect', function(socket) {
      console.log('User disconnected');
      sendUserCount();
    });
    socket.on('requestHistory', function (socket) {
      console.log('History requested! Sending...');
      sendHistory();
    });
    sendUserCount();
  });
  
  
  try {
    gatherBoardStats();
  }
  catch(err) {
    throw err;
  }
};

const gatherBoardStats = async() => {
    await catalog.getBoardStats(config.boards);
    await sendHistory();

    // set a delay between each cycle
    setTimeout(async () => {
        await gatherBoardStats();
    }, 2000);
};

const sendUserCount = () => {
  const userCount = io.engine.clientsCount;
  console.log('Sending user count');
  io.emit('usersCount', userCount);
};
const sendHistory = async () => {
  const data = await db.retrieveHistory();
  console.log('Sending history...');
  io.emit('history', data);  

  return data;
};

main();

module.exports = {
  app,
  server,
}