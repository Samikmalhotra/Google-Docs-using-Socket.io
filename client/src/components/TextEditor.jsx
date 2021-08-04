import React, { useCallback, useEffect, useState } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import {io} from 'socket.io-client'
import {useParams} from 'react-router-dom'

const TOOLBAR_OPTIONS = [
    [{header: [1, 2,3,4,5,6, false]}],
    [{font: []}],
    [{list: 'ordered'},{list: 'bullet'}],
    ["bold","italic","underline","strike"],
    [{color: []},{background: []}],
    [{link: []}],
    ["image","blockquote","code-block"],
    ["clean"]
]

const SAVE_INTERVAL_MS = 2000

const TextEditor = () => {

    const {id: documentId} = useParams();

    const [socket,setSocket] = useState()
    const [quill,setQuill] = useState()

    // Connecting socket
    useEffect(() => {
        const s = io("http://localhost:3001");
        setSocket(s);
        return(()=>{
            s.disconnect()
        })
    },[])

    // Text-change handler
    useEffect(() => {
        if(socket == null || quill == null) {return}
        const handler = (delta, oldDelta, source) => {
            if(source !== "user"){return}
            socket.emit("send-changes",delta)
            console.log(delta)
        }
        quill.on("text-change", handler)
        return () => {
            quill.off('text-change', handler)
        }
    }, [socket, quill])

    // Saving changes
    useEffect(() => {
        if(socket == null || quill == null) {return}

        const interval = setInterval(() => {
            socket.emit("save-document", quill.getContents())
        }, SAVE_INTERVAL_MS)
        return () => {
            clearInterval(interval)
        }
    }, [socket, quill])

    // Load document
    useEffect(() => {
        if(socket == null || quill == null) return

        socket.once("load-document", document => {
            quill.setContents(document)
            quill.enable()
        })

        socket.emit('get-document', documentId)
    }, [socket, quill, documentId])

    // Update other docs on same link
    useEffect(() => {
        if(socket == null || quill == null) {return}
        const handler = (delta, oldDelta, source) => {
            quill.updateContents(delta)
        }
        socket.on("recieve-changes", handler)
        return () => {
            socket.off('recieve-changes', handler)
        }
    }, [socket, quill])

    const wrapperRef = useCallback((wrapper) => {
        if(wrapper === null){return}
        wrapper.innerHTML = ''
        const editor = document.createElement('div');
        wrapper.append(editor);
        const q = new Quill(editor,{theme: "snow", modules:{toolbar: TOOLBAR_OPTIONS}});
        q.disable();
        q.setText('Loading...')
        setQuill(q);
    },[])
    return (
        <div id='editor' ref={wrapperRef}>
            
        </div>
    )
}

export default TextEditor
