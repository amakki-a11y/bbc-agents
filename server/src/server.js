const http = require('http');
const app = require('./app');
const { initialize } = require('./websocket');
const { attachMeetingAgentSocket } = require('./websocket/meetingAgentSocket');

const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize Socket.IO
initialize(server);
attachMeetingAgentSocket(server);

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
