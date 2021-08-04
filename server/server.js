const mongoose = require('mongoose')
require('dotenv').config()
const Document = require('./models/Document')

const db = process.env.DB

const defaultValue = " ";

mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
})

const io = require("socket.io")(3001, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

io.on("connection", socket => {
    socket.on('get-document', async documentId =>  {
        const document = await findOrCreateDocument(documentId);
        socket.join(documentId);
        socket.emit('load-document', document.data)
        socket.on('send-changes', delta => {
            socket.broadcast.to(documentId).emit("recieve-changes",delta)
        })

        socket.on('save-document', async (data) => {
            await Document.findByIdAndUpdate(documentId, {data: data}, {new: true})
        })
    })

})

async function findOrCreateDocument(id){
    if(id == null) return;

    const document = await Document.findById(id)
    if(document) return document;
    const newDoc = new Document({_id: id, data: defaultValue})
    await newDoc.save();
    return newDoc;
}