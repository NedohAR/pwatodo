import { addNote, deleteNote, getNotes, openDatabase, updateNote } from "./db.js";

let mediaStream = null;

function displayNotes() {
    const noteList = document.getElementById("note-list");
    const fragment = document.createDocumentFragment();

    getNotes().then((notes) => {
        notes.forEach((note) => {
            const noteItem = document.createElement("div");
            noteItem.className = "note";
            noteItem.dataset.id = note.id;

            noteItem.innerHTML = `
                <h3>${note.title}</h3>
                <p>${note.content}</p>
                <p>${new Date(note.created).toLocaleString()}</p>
                ${note.photo ? `<img src="${note.photo}" alt="Note photo" style="max-width: 100%; margin-top: 10px;" />` : ""}
                ${note.audio ? `<audio controls src="${note.audio}" style="margin-top: 10px;"></audio>` : ""}
                <div class="note-actions">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </div>
            `;

            noteItem.querySelector(".edit-btn").addEventListener("click", () => editNoteHandler(note));
            noteItem.querySelector(".delete-btn").addEventListener("click", () => {
                if (confirm("Are you sure you want to delete this note?")) {
                    deleteNote(note.id).then(() => displayNotes());
                }
            });

            fragment.appendChild(noteItem);
        });

        noteList.innerHTML = "";
        noteList.appendChild(fragment);
    });
}

function editNoteHandler(note) {
    const editNoteForm = document.getElementById("edit-note-form");
    editNoteForm.innerHTML = editNoteForm.innerHTML = `
    <div class="edit-note-form">
        <input 
            type="text" 
            id="edit-note-title" 
            value="${note.title}" 
            placeholder="Enter title" 
            class="edit-input" 
        />
        <input 
            type="text" 
            id="edit-note-content" 
            value="${note.content}" 
            placeholder="Enter content" 
            class="edit-input" 
        />
        <div class="photo-section">
            <button id="edit-take-photo-button" class="action-button">Take Photo</button>
            <video 
                id="edit-camera-preview" 
                autoplay 
                playsinline 
                style="display: none;" 
                class="camera-preview">
            </video>
            <canvas 
                id="edit-photo-canvas" 
                style="display: none;" 
                class="photo-canvas">
            </canvas>
            <img 
                id="edit-photo-preview" 
                src="${note.photo || ""}" 
                style="display: ${note.photo ? "block" : "none"}; margin-top: 10px;" 
                class="photo-preview" 
                alt="Photo Preview" 
            />
        </div>
        <div class="audio-section">
            <button id="edit-record-audio-button" class="action-button">Record Audio</button>
            <audio 
                id="edit-audio-preview" 
                controls 
                src="${note.audio || ""}" 
                style="display: ${note.audio ? "block" : "none"}; margin-top: 10px;" 
                class="audio-preview">
            </audio>
        </div>
        <button id="save-note-button" class="save-button">Save</button>
    </div>
`;

    let photoData = note.photo || null;
    let audioBlob = null;

    const editTakePhotoButton = document.getElementById("edit-take-photo-button");
    const editCameraPreview = document.getElementById("edit-camera-preview");
    const editPhotoCanvas = document.getElementById("edit-photo-canvas");
    const editPhotoPreview = document.getElementById("edit-photo-preview");

    const editRecordAudioButton = document.getElementById("edit-record-audio-button");
    const editAudioPreview = document.getElementById("edit-audio-preview");

    let mediaRecorder;

    editTakePhotoButton.addEventListener("click", async () => {
        if (!mediaStream) {
            mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            editCameraPreview.srcObject = mediaStream;
            editCameraPreview.style.display = "block";
            editTakePhotoButton.textContent = "Capture Photo";
        } else {
            const context = editPhotoCanvas.getContext("2d");
            editPhotoCanvas.width = editCameraPreview.videoWidth;
            editPhotoCanvas.height = editCameraPreview.videoHeight;
            context.drawImage(editCameraPreview, 0, 0, editPhotoCanvas.width, editPhotoCanvas.height);
            photoData = editPhotoCanvas.toDataURL("image/png");
            editPhotoPreview.src = photoData;
            editPhotoPreview.style.display = "block";
            editCameraPreview.style.display = "none";
            editTakePhotoButton.textContent = "Take Photo";

            mediaStream.getTracks().forEach((track) => track.stop());
            mediaStream = null;
        }
    });

    editRecordAudioButton.addEventListener("click", () => {
        if (!mediaRecorder || mediaRecorder.state === "inactive") {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then((stream) => {
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.start();
                    editRecordAudioButton.textContent = "Stop Recording";

                    const audioChunks = [];
                    mediaRecorder.addEventListener("dataavailable", (event) => {
                        audioChunks.push(event.data);
                    });

                    mediaRecorder.addEventListener("stop", () => {
                        audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
                        editAudioPreview.src = URL.createObjectURL(audioBlob);
                        editAudioPreview.style.display = "block";
                        editRecordAudioButton.textContent = "Record Audio";

                        stream.getTracks().forEach((track) => track.stop());
                    });
                })
                .catch((error) => alert("Error accessing microphone: " + error));
        } else {
            mediaRecorder.stop();
        }
    });

    document.getElementById("save-note-button").addEventListener("click", () => {
        const updatedTitle = document.getElementById("edit-note-title").value.trim();
        const updatedContent = document.getElementById("edit-note-content").value.trim();

        if (updatedTitle && updatedContent) {
            updateNote(note.id, updatedTitle, updatedContent, photoData, audioBlob ? URL.createObjectURL(audioBlob) : note.audio).then(() => {
                switchScreen("note-list-screen");
                displayNotes();
            });
        } else {
            alert("Please fill out both the title and the content.");
        }
    });

    switchScreen("edit-note-screen");
}

document.addEventListener("DOMContentLoaded", () => {
    const addNoteButton = document.getElementById("add-note-button");
    const noteTitleInput = document.getElementById("note-title");
    const noteContentInput = document.getElementById("note-content");
    const takePhotoButton = document.getElementById("take-photo-button");
    const cameraPreview = document.getElementById("camera-preview");
    const photoCanvas = document.getElementById("photo-canvas");
    const photoPreview = document.getElementById("photo-preview");
    const recordAudioButton = document.getElementById("record-audio-button");
    const audioPreview = document.getElementById("audio-preview");

    let photoData = null;
    let audioBlob = null;

    let mediaRecorder;

    recordAudioButton.addEventListener("click", () => {
        if (!mediaRecorder || mediaRecorder.state === "inactive") {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then((stream) => {
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.start();
                    recordAudioButton.textContent = "Stop Recording";

                    const audioChunks = [];
                    mediaRecorder.addEventListener("dataavailable", (event) => {
                        audioChunks.push(event.data);
                    });

                    mediaRecorder.addEventListener("stop", () => {
                        audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
                        audioPreview.src = URL.createObjectURL(audioBlob);
                        audioPreview.style.display = "block";
                        recordAudioButton.textContent = "Record Audio";

                        stream.getTracks().forEach((track) => track.stop());
                    });
                })
                .catch((error) => alert("Error accessing microphone: " + error));
        } else {
            mediaRecorder.stop();
        }
    });

    takePhotoButton.addEventListener("click", async () => {
        if (!mediaStream) {
            mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            cameraPreview.srcObject = mediaStream;
            cameraPreview.style.display = "block";
            takePhotoButton.textContent = "Capture Photo";
        } else {
            const context = photoCanvas.getContext("2d");
            photoCanvas.width = cameraPreview.videoWidth;
            photoCanvas.height = cameraPreview.videoHeight;
            context.drawImage(cameraPreview, 0, 0, photoCanvas.width, photoCanvas.height);
            photoData = photoCanvas.toDataURL("image/png");
            photoPreview.src = photoData;
            photoPreview.style.display = "block";
            cameraPreview.style.display = "none";
            takePhotoButton.textContent = "Take Photo";

            mediaStream.getTracks().forEach((track) => track.stop());
            mediaStream = null;
        }
    });

    openDatabase().then(() => {
        displayNotes();

        addNoteButton.addEventListener("click", () => {
            const title = noteTitleInput.value.trim();
            const content = noteContentInput.value.trim();

            if (title && content) {
                addNote(title, content, photoData, audioBlob ? URL.createObjectURL(audioBlob) : null).then(() => {
                    switchScreen("note-list-screen");
                    displayNotes();
                    noteTitleInput.value = "";
                    noteContentInput.value = "";
                    photoPreview.style.display = "none";
                    audioPreview.style.display = "none";
                    photoData = null;
                    audioBlob = null;
                });
            } else {
                alert("Please fill out both the title and the content.");
            }
        });
    });
});

function switchScreen(screenId) {
    document.querySelectorAll(".screen").forEach((screen) => {
        screen.classList.remove("active");
    });
    document.getElementById(screenId).classList.add("active");
}

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
