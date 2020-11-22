const express = require('express');
const app = express();
const server = require('http').createServer(app);
const socketio = require('socket.io');
server.listen(3000,()=>{
    console.log("listening to 3000 port");
});
const io = socketio.listen(server);

io.on('connection',(socket)=>{
    
    socket.on('joinRoom', (data) => {
        socket.join(data.roomName,() => {

            io.to(data.roomName).emit('newJoin' ,{count : getOnlineCount(io,data),message :`  ${data.userName}  joined to ${data.roomName} room <br> `});
            socket.emit('joinedRoom');
            const rooms = Object.keys(socket.rooms);
            console.log(rooms);
         
        });
    });
    socket.on('sendMessage',(data)=>{
        io.to(data.roomName).emit('message',{message: `<strong>${data.userName}</strong> <br> ${data.message} `});
          
    });
    socket.on('leave',(data)=>{
        socket.leave(data.roomName,()=>{
            socket.emit('youleaved',);
            io.to(data.roomName).emit('leaved' ,{count : getOnlineCount(io,data),message :`  ${data.userName}  leaved to ${data.roomName} room <br> `});
        });
    });

});
const getOnlineCount = (io,data) => {
    const room = io.sockets.adapter.rooms[data.roomName] ;
    return room ? room.length : 0;
};
