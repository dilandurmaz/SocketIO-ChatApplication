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
    msg  : String,
    room : String,
    online: String,
    created : {type : Date,default:Date.now}
});

const Chat = mongoose.model('Message',chatSchema);
const on = mongoose.model('online',chatSchema);
// SOCKETİO
const io = socketio.listen(server);
io.on('connection',(socket)=>{
 
    
    socket.on('joinRoom', (data) => {
        
        Chat.find({ room: { $eq: data.roomName }}, { '_id': 0, 'user' :1,'msg':1}, (error, doc) => {
                
                file = JSON.stringify(doc);
                s = file.replace(/[\[\]{}"",]+/g, '');                
                console.log(s);
                socket.emit('oldMessages',s);
                
        });
        
        socket.join(data.roomName,() => {
         
            io.to(data.roomName).emit('newJoin' ,{count : getOnlineCount(io,data),message: `${data.userName}  joined to ${data.roomName} room <br> `});
            const onl = new on({user:`${data.userName}`,room:`${data.roomName}`});
            onl.save();
            on.find({ room: { $eq: data.roomName }},{'user':1,'_id': 0,}, (error, durum) => {
                
            AA = JSON.stringify(durum);
            aa = AA.replace(/[\[\]{}"",]+/g, '');
            socket.emit('joinedRoom',aa);
            });
      
            
            // const rooms = Object.keys(socket.rooms);
            // console.log(rooms);
           
         
        });
    });
    socket.on('sendMessage',(data)=>{
        const newMsg = new Chat({user:` <br> <strong> ${data.userName}</strong>:::: <br>`,msg:data.message,room:data.roomName});
        newMsg.save((err)=>{
            if(err) throw err ;
            io.to(data.roomName).emit('message',{message: `<strong>${data.userName}</strong> :::${data.message}  `});
        });
      
          
    });
    socket.on('leave',(data)=>{
        socket.leave(data.roomName,()=>{
            socket.emit('youleaved');
            on.deleteOne({ user: { $eq: data.userName}}).then(function(){ 
                console.log("user deleted"); // Success 
            }).catch(function(error){ 
                console.log(error); // Failure 
            }); 
            io.to(data.roomName).emit('leaved' ,{count : getOnlineCount(io,data),message :`  ${data.userName}  leaved to ${data.roomName} room <br> `});
        });
    });

});
const getOnlineCount = (io,data) => {
    const room = io.sockets.adapter.rooms[data.roomName] ;
    return room ? room.length : 0;
};
