const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);//開express server
const io = new Server(server, {//cros
  cors: {
    origin: ['http://localhost:8080'],
    methods: ['GET', 'POST'],
  }
});

//http & socket port
io.on('connection', function (socket) {//當客戶端連進來
    console.log(` ${socket.id} connected`);
    socket.emit("connected", {id:socket.id});
    
    //socket.join(socket.id);//私訊用 每個人都在自己的id的room中 這步驟應該是自動的
    io.to(socket.id).emit("hi",`現有指令: message,joinRoom,queryRoom,queryMyRoom,privateMessage,roomMessage`);//功能提示
    //私訊使用io to發送
    socket.on('privateMessage', (data) => {
        const { targetSocketId, message } = data;
        io.to(targetSocketId).emit("message", `私訊來自${socket.id}: ${message}`);
    });

    socket.on('message',(mes) => {//接客戶端丟來的一般message
        console.log(mes);
    })
    //查詢所有房間
    socket.on('queryRoom',()=>{
        var allRooms = io.sockets.adapter.rooms;
        var roomNames = Array.from(allRooms.keys()).filter(roomName => !roomName.includes('/'));
        io.to(socket.id).emit("message",`現有房間: ${roomNames}`);
    })
    //查詢已加入房間
    socket.on('queryMyRoom',()=>{
        var allMyRooms = socket.rooms;
        var myRoomNames = Array.from(allMyRooms.keys()).filter(roomName => !roomName.includes('/'));
        io.to(socket.id).emit("message",`已加入房間: ${myRoomNames}`);
    })
     //加入房間
    socket.on('joinRoom',(roomId)=>{
        socket.join(roomId);
        io.to(roomId).emit("hi",`歡迎客戶端${socket.id}加入了房間：${roomId}`);
        console.log(`客戶端${socket.id}加入了房間：${roomId}`);
    })
    //對房間內所有人發送
    socket.on('roomMessage', (data,callbackF) => {
        const { roomId, message } = data;
        io.to(roomId).emit("message", `{"socketId":"${socket.id}","message": "${message}"}`);
        callbackF("got it");
    });
    //退出連接
    socket.on('disconnect', () => {
        console.log(`客戶端${socket.id}退出連接`);
    });
})

const PORT = 4040;
server.listen(PORT, () => {
  console.log(`Socket.IO server is listening on port ${PORT}`);
});