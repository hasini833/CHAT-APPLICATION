const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const path = require("path")

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

app.use(express.static(path.join(__dirname)))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

const users = new Map()

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id)

  socket.on("join", (username) => {
    const user = {
      id: socket.id,
      username: username,
    }

    users.set(socket.id, user)
    socket.join("chat")

    socket.broadcast.emit("userJoined", {
      username: username,
      users: Array.from(users.values()),
    })

    socket.emit("users", Array.from(users.values()))

    console.log(`User ${username} joined with ID ${socket.id}`)
  })

  socket.on("message", (data) => {
    const message = {
      id: Date.now().toString(),
      username: data.username,
      message: data.message,
      timestamp: new Date(),
    }

    io.to("chat").emit("message", message)
    console.log(`Message from ${data.username}: ${data.message}`)
  })

  socket.on("disconnect", () => {
    const user = users.get(socket.id)
    if (user) {
      users.delete(socket.id)
      socket.broadcast.emit("userLeft", {
        username: user.username,
        users: Array.from(users.values()),
      })
      console.log(`User ${user.username} disconnected`)
    }
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Open http://localhost:${PORT} in your browser`)
})
