import { openDatabase, addNote, getNotes, deleteNote, updateNote } from "./db.js";

function displayNotes() {
    const noteList = document.getElementById("note-list");
    noteList.innerHTML = "";

    getNotes().then((notes) => {
        notes.forEach((note) => {
            const noteItem = document.createElement("div");
            noteItem.className = "note";

            noteItem.innerHTML = `
                <h3>${note.title}</h3>
                <p>${note.content}</p>
                <p>${new Date(note.created).toLocaleString()}</p>
                ${note.photo ? `<img src="${note.photo}" alt="Note Photo" class="note-photo" />` : ""}
                ${note.audio ? `<audio controls src="${note.audio}" class="note-audio"></audio>` : ""}
                <div class="note-actions">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </div>
                <div class="edit-mode" style="display: none;">
                    <input type="text" class="edit-title" value="${note.title}" />
                    <input type="text" class="edit-content" value="${note.content}" />
                    <div class="photo-edit-container">
                        <div>
                            <h4>Current Photo:</h4>
                            ${note.photo ? `<img src="${note.photo}" alt="Note Photo" class="note-photo" />` : "<p>No photo available</p>"}
                        </div>
                        <div>
                            <h4>Camera Preview:</h4>
                            <video autoplay class="camera-preview" style="display: none;"></video>
                            <button class="capture-photo-btn">Capture Photo</button>
                            <img src="" alt="Captured Photo Preview" class="captured-photo-preview" />
                        </div>
                    </div>
                    <div class="audio-edit-container">
                        <h4>Change Audio:</h4>
                        <button class="edit-audio-btn">Record New Audio</button>
                    </div>
                    <button class="save-btn">Save</button>
                </div>
            `;

            noteList.appendChild(noteItem);

            const cameraPreview = noteItem.querySelector(".camera-preview");
            const capturedPhotoPreview = noteItem.querySelector(".captured-photo-preview");
            const photoCanvas = document.createElement("canvas");

            let newPhotoData = note.photo;
            let newAudioData = note.audio;

            noteItem.querySelector(".edit-btn").addEventListener("click", async () => {
                const editMode = noteItem.querySelector(".edit-mode");
                editMode.style.display = "block";
                noteItem.querySelector(".edit-btn").style.display = "none";

                // Включение камеры
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                cameraPreview.srcObject = stream;
                cameraPreview.style.display = "block"; // Показываем камеру
                capturedPhotoPreview.style.display = "none"; // Прячем фото

                // Захват фото
                const capturePhotoButton = noteItem.querySelector(".capture-photo-btn");
                capturePhotoButton.addEventListener("click", () => {
                    const context = photoCanvas.getContext("2d");
                    photoCanvas.width = cameraPreview.videoWidth;
                    photoCanvas.height = cameraPreview.videoHeight;
                    context.drawImage(cameraPreview, 0, 0, photoCanvas.width, photoCanvas.height);
                    newPhotoData = photoCanvas.toDataURL("image/png");
                    capturedPhotoPreview.src = newPhotoData;
                    capturedPhotoPreview.style.display = "block"; // Показываем сделанное фото
                    cameraPreview.style.display = "none"; // Прячем камеру
                    alert("Photo captured!");
                });

                // Изменение аудио
                const editAudioButton = noteItem.querySelector(".edit-audio-btn");
                editAudioButton.addEventListener("click", () => {
                    let mediaRecorder;
                    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                        mediaRecorder = new MediaRecorder(stream);
                        mediaRecorder.start();
                        editAudioButton.textContent = "Stop Recording";

                        const audioChunks = [];
                        mediaRecorder.addEventListener("dataavailable", (event) => {
                            audioChunks.push(event.data);
                        });

                        mediaRecorder.addEventListener("stop", () => {
                            newAudioData = URL.createObjectURL(new Blob(audioChunks, { type: "audio/mp3" }));
                            editAudioButton.textContent = "Record New Audio";
                            alert("Audio recorded!");
                        });

                        editAudioButton.addEventListener("click", () => {
                            if (mediaRecorder.state === "recording") {
                                mediaRecorder.stop();
                            }
                        });
                    });
                });

                // Сохранение изменений
                noteItem.querySelector(".save-btn").addEventListener("click", () => {
                    const newTitle = noteItem.querySelector(".edit-title").value.trim();
                    const newContent = noteItem.querySelector(".edit-content").value.trim();

                    if (newTitle && newContent) {
                        updateNote(note.id, newTitle, newContent, newPhotoData, newAudioData).then(() => {
                            stream.getTracks().forEach((track) => track.stop()); // Остановить камеру
                            displayNotes();
                        });
                    } else {
                        alert("Please fill out both the title and the content.");
                    }
                });
            });

            noteItem.querySelector(".delete-btn").addEventListener("click", () => {
                const confirmDelete = confirm("Are you sure you want to delete this note?");
                if (confirmDelete) {
                    deleteNote(note.id).then(() => displayNotes());
                }
            });
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const addNoteButton = document.getElementById("add-note-button");
    const noteTitleInput = document.getElementById("note-title");
    const noteContentInput = document.getElementById("note-content");

    openDatabase().then(() => {
        displayNotes();

        addNoteButton.addEventListener("click", () => {
            const title = noteTitleInput.value.trim();
            const content = noteContentInput.value.trim();

            if (title && content) {
                addNote(title, content).then(() => {
                    displayNotes();
                    noteTitleInput.value = "";
                    noteContentInput.value = "";
                });
            } else {
                alert("Please fill out both the title and the content.");
            }
        });
    });
});

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("sw.js")
            .then((registration) => {
                console.log("SW registered: ", registration);
            })
            .catch((registrationError) => {
                console.log("SW registration failed: ", registrationError);
            });
    });
}

const connectionStatus = document.getElementById("connection-status");

function updateConnectionStatus() {
    if (navigator.onLine) {
        connectionStatus.textContent = "Online";
        connectionStatus.classList.remove("offline");
        connectionStatus.classList.add("online");
    } else {
        connectionStatus.textContent = "Offline";
        connectionStatus.classList.remove("online");
        connectionStatus.classList.add("offline");
    }
}

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);
window.addEventListener("load", updateConnectionStatus);


