const db = require('./db/db');

console.log('Initializing API');
io.on('connection', function(socket) {
    console.log('User connected');
});

const sendHistory = async () => {
    const data = await db.retrieveHistory();
    
    io.emit('history', data);    
    return data;
};

module.exports = {
    sendHistory,
}

