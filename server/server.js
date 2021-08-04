const io = require('socket.io')(3001, {
    cors:{
        origin:'*',
        methods: [ 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'DELETE' ]
    }
});

io.on("connection", socket => {
    console.log("A user connected");
})