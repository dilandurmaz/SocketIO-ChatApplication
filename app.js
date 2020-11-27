const express = require('express');
const app = express();
const server = require('http').createServer(app);
const socketio = require('socket.io');
const mongoose = require('mongoose');
server.listen(3000,()=>{
    console.log("listening to 3000 port");
});

// MONGODB CONNECT
mongoose.connect('mongodb://localhost/chat',(err)=>{
   if(err){
       console.log(err);
   }else{
       console.log('Connected to mongodb!');
   }
});
const chatSchema = mongoose.Schema({
    user : String,
    room : String,
    created : {type : Date,default:Date.now}
});

const Chat = mongoose.model('Message',chatSchema);
// SOCKETİO
const io = socketio.listen(server);
io.on('connection',(socket)=>{
  
    
    socket.on('joinRoom', (data) => {

        Chat.find({ room: { $eq: data.roomName }}, { '_id': 0, 'user' :1}, (error, doc) => {
                
                deneme = JSON.stringify(doc);
                s = deneme.replace(/[\[\]{}""]+/g, '');
                d = s.replace(",","<br>");
                socket.emit('oldMessages',d);
                
            });
       

        socket.join(data.roomName,() => {
            io.to(data.roomName).emit('newJoin' ,{count : getOnlineCount(io,data),message :`  ${data.userName}  joined to ${data.roomName} room <br> `});
            socket.emit('joinedRoom');
            // const rooms = Object.keys(socket.rooms);
            // console.log(rooms);
           
         
        });
    });
    socket.on('sendMessage',(data)=>{
        const newMsg = new Chat({user:` <strong> ${data.userName}</strong>::::  ${data.message} `,room:data.roomName});
        newMsg.save((err)=>{
            if(err) throw err ;
            io.to(data.roomName).emit('message',{message: `<strong>${data.userName}</strong> :::${data.message}  `});
        });
      
          
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
