import {openDatabase, addNote, getNotes} from "./db.js";

function displayNotes() {
    const noteList = document.getElementById("note-list");
    noteList.innerHTML = "";

    getNotes().then((notes) => {
        notes.forEach((note) => {
            const noteItem = document.createElement("div");
            noteItem.className = "note";
            noteItem.innerHTML = `<h3>${note.title}</h3><p>${note.content}</p><p>${new Date(note.created).toLocaleString()}</p>`;
            noteList.appendChild(noteItem);
        })
    })
}

document.addEventListener("DOMContentLoaded", () => {
    const addNoteButton = document.getElementById("add-note-button");

    openDatabase().then(() => {
        displayNotes();

        addNoteButton.addEventListener("click", () => {
            const title = prompt("Enter a title for your note");
            const content = prompt("Enter the content for your note");

            if (title && content) {
                addNote(title, content);
                displayNotes();
            }
        })
    })
})

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then((registration) => {
            console.log('SW registered: ', registration);
        }).catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
        });
    })
}

const connectionStatus = document.getElementById("connection-status");

function updateConnectionStatus() {
    if (navigator.onLine) {
        connectionStatus.textContent = "Online";
        connectionStatus.classList.remove("offline");
        connectionStatus.classList.add("online");

    } else {
        connectionStatus.innerHTML = "Offline";
        connectionStatus.classList.remove("online");
        connectionStatus.classList.add("offline");
    }
}

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);
window.addEventListener("load", updateConnectionStatus);