const express = require('express');
const app = express();
const server = require('http').createServer(app);
const socketio = require('socket.io');
const mongoose = require('mongoose');
server.listen(3000,"0.0.0.0", () => {
    console.log("listening to 3000 port");
});

// MONGODB CONNECT
mongoose.connect("mongodb://localhost:27017/chat", { useNewUrlParser: true, useUnifiedTopology: true },(err)=>{
    if (err) {
        console.log(err);
    }else{
        console.log('Connected to mongodb!');
    }

});
const chatSchema = mongoose.Schema({
    user: String,
    room: String,
    online: String,
    created: { type: Date, default: Date.now }
});

const Chat = mongoose.model('Message', chatSchema);
const on = mongoose.model('online', chatSchema);
// SOCKETİO
const io = socketio.listen(server);
io.on('connection', (socket) => {


    socket.on('joinRoom', (data) => {

        Chat.find({ room: { $eq: data.roomName } }, { '_id': 0, 'user': 1, 'msg': 1 }, (error, doc) => {
                
                file = JSON.stringify(doc);
                s = file.replace(/[\[\]{}"",]+/g, '');
                un = s.replace(/user:/g, " ");
                // console.log(un);
                socket.emit('oldMessages', un);          

        });

        socket.join(data.roomName, () => {
            socket.emit('joinedRoom',{name:`${data.userName}`});
           
            io.to(data.roomName).emit('newJoin', { count: getOnlineCount(io, data), message: `${data.userName}  <span class="online"></span> <br> ` });
            const onl = new on({ user: `${data.userName}`, room: `${data.roomName}` });
            onl.save();
            on.find({ room: { $eq: data.roomName } }, { 'user': 1, '_id': 0, }, (error, durum) => {
             
                    AA = JSON.stringify(durum);
                    aa = AA.replace(/[\[\]{}"",]+/g, '');
                    un = aa.replace(/user:/g, " ");
                    socket.emit('joinedRoomUser', un);
                             
            });
           


          


        });
    });
    socket.on('sendMessage', (data) => {
        const newMsg = new Chat({ user: ` ${data.userName}</strong>  ${data.message} <br>  `, room: data.roomName });
        newMsg.save((err) => {
            if (err) throw err;
            io.to(data.roomName).emit('message', { message: `<div style="background-color:white;height:20%;border:3px solid gray; border-radius: 25px;"> <strong>${data.userName}</strong> <br>${data.message} </div> ` });
        });


    });
    socket.on('leave', (data) => {
        socket.leave(data.roomName, () => {
            socket.emit('youleaved');
            on.deleteOne({ user: { $eq: data.userName}}).then(function(){ 
                console.log("user deleted"); // Success 
            }).catch(function(error){ 
                console.log(error); // Failure 
            }); 
            on.find({ room: { $eq: data.roomName } }, { 'user': 1, '_id': 0, }, (error, durum) => {
             
                AA = JSON.stringify(durum);
                aa = AA.replace(/[\[\]{}"",]+/g, '');
                un = aa.replace(/user:/g, " ");
                io.to(data.roomName).emit('leaved', { count: getOnlineCount(io, data), message: `  ${data.userName} leaved <br> ` });
                // io.to(data.roomName).emit('leaved', { count: getOnlineCount(io, data), msg: `  ${un} ` });         
             });
           
        });
    });

});
const getOnlineCount = (io, data) => {
    const room = io.sockets.adapter.rooms[data.roomName];
    return room ? room.length : 0;
};