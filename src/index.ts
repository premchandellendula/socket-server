import cors from 'cors'
import express from 'express'

const app = express()
const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
    console.log(`Server is running on localhost:3001`)
})
const allowedOrigins = ["http://localhost:3000", "https://real-time-chat-app-rem.vercel.app/"]
app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

import { Server } from "socket.io";

const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
})

io.on("connection", (socket) => {
    console.log("Connected to socket.io")

    socket.on("setup", (userData) => {
        if(!userData || !userData.id){
            console.log("Invalid userData:", userData);
            return;
        }

        socket.join(userData.id);
        // console.log(userData.id)
        socket.emit("connected")
    })

    socket.on("join chat", (room) => {
        socket.join(room)
        console.log("User joined room: ", room)
    })

    socket.on("typing", (room) => {
        socket.in(room).emit("typing")
    })

    socket.on("stop typing", (room) => {
        socket.in(room).emit("stop typing")
    })

    socket.on("new message", (newMessage) => {
        const _chat = newMessage.chat;
        // console.log(newMessage)

        if(!_chat.users){
            console.log("chat.users is not defined");
            return;
        }

        _chat.users.forEach((user: any) => {
            if(user.id === newMessage.user.id) return;
            console.log(user._id)
            // console.log(newMessage.message)
            socket.in(user.id).emit("message received", newMessage)
        })

        socket.off("setup", (userData) => {
            console.log("USER DISCONNECTED")
            socket.leave(userData.id)
        })
    })
})