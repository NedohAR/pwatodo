import { openDatabase, addNote, getNotes, deleteNote, updateNote } from "./db.js";

let mediaStream = null;

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
                ${note.photo ? `<img src="${note.photo}" alt="Note photo" style="max-width: 100%; margin-top: 10px;" />` : ""}
                ${note.audio ? `<audio controls src="${note.audio}" style="margin-top: 10px;"></audio>` : ""}
                <div class="note-actions">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </div>
                <div class="edit-mode" style="display: none;">
                    <input type="text" class="edit-title" value="${note.title}" />
                    <input type="text" class="edit-content" value="${note.content}" />
                    <div class="photo-edit-container">
                        <div>
                            <video class="camera-preview" autoplay playsinline style="display: none;"></video>
                            <button class="capture-photo-btn">Take Photo</button>
                            <img class="captured-photo-preview" src="${note.photo || ""}" style="max-width: 100%; display: ${note.photo ? "block" : "none"};" />
                        </div>
                    </div>
                    <div class="audio-edit-container">
                        <button class="record-audio-btn">Record Audio</button>
                        <audio class="edited-audio-preview" controls src="${note.audio || ""}" style="display: ${note.audio ? "block" : "none"};"></audio>
                    </div>
                    <button class="save-btn">Save</button>
                </div>
            `;

            noteList.appendChild(noteItem);

            // Редактирование заметки
            noteItem.querySelector(".edit-btn").addEventListener("click", () => {
                const editMode = noteItem.querySelector(".edit-mode");
                editMode.style.display = "block";
                noteItem.querySelector(".edit-btn").style.display = "none";

                const capturePhotoBtn = noteItem.querySelector(".capture-photo-btn");
                const cameraPreview = noteItem.querySelector(".camera-preview");
                const capturedPhotoPreview = noteItem.querySelector(".captured-photo-preview");
                let updatedPhotoData = note.photo;

                const recordAudioBtn = noteItem.querySelector(".record-audio-btn");
                const audioPreview = noteItem.querySelector(".edited-audio-preview");
                let updatedAudioBlob = null;

                // Функционал записи аудио
                let mediaRecorder;
                recordAudioBtn.addEventListener("click", () => {
                    if (!mediaRecorder || mediaRecorder.state === "inactive") {
                        navigator.mediaDevices.getUserMedia({ audio: true })
                            .then((stream) => {
                                mediaRecorder = new MediaRecorder(stream);
                                mediaRecorder.start();
                                recordAudioBtn.textContent = "Stop Recording";

                                const audioChunks = [];
                                mediaRecorder.addEventListener("dataavailable", (event) => {
                                    audioChunks.push(event.data);
                                });

                                mediaRecorder.addEventListener("stop", () => {
                                    updatedAudioBlob = new Blob(audioChunks, { type: "audio/mp3" });
                                    const audioURL = URL.createObjectURL(updatedAudioBlob);
                                    audioPreview.src = audioURL;
                                    audioPreview.style.display = "block";
                                    recordAudioBtn.textContent = "Record Audio";

                                    // Остановить аудио-поток
                                    stream.getTracks().forEach((track) => track.stop());
                                });
                            })
                            .catch((error) => alert("Error accessing microphone: " + error));
                    } else {
                        mediaRecorder.stop();
                    }
                });

                // Функционал съемки фото
                capturePhotoBtn.addEventListener("click", async () => {
                    if (!mediaStream) {
                        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                        cameraPreview.srcObject = mediaStream;
                        cameraPreview.style.display = "block";
                        capturedPhotoPreview.style.display = "none";
                        capturePhotoBtn.textContent = "Capture Photo";
                    } else {
                        const canvas = document.createElement("canvas");
                        canvas.width = cameraPreview.videoWidth;
                        canvas.height = cameraPreview.videoHeight;
                        const context = canvas.getContext("2d");
                        context.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);

                        updatedPhotoData = canvas.toDataURL("image/png");
                        capturedPhotoPreview.src = updatedPhotoData;
                        capturedPhotoPreview.style.display = "block";
                        cameraPreview.style.display = "none";
                        capturePhotoBtn.textContent = "Take Photo";

                        // Остановить камеру
                        mediaStream.getTracks().forEach((track) => track.stop());
                        mediaStream = null;
                    }
                });

                // Сохранение изменений
                noteItem.querySelector(".save-btn").addEventListener("click", () => {
                    const newTitle = noteItem.querySelector(".edit-title").value.trim();
                    const newContent = noteItem.querySelector(".edit-content").value.trim();

                    if (newTitle && newContent) {
                        updateNote(
                            note.id,
                            newTitle,
                            newContent,
                            updatedPhotoData || note.photo,
                            updatedAudioBlob ? URL.createObjectURL(updatedAudioBlob) : note.audio
                        );
                        displayNotes();
                    } else {
                        alert("Please fill out both the title and the content.");
                    }
                });
            });

            // Удаление заметки
            noteItem.querySelector(".delete-btn").addEventListener("click", () => {
                const confirmDelete = confirm("Are you sure you want to delete this note?");
                if (confirmDelete) {
                    deleteNote(note.id);
                    displayNotes();
                }
            });
        });
    });
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

    // Запись аудио при добавлении
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
                        const audioURL = URL.createObjectURL(audioBlob);
                        audioPreview.src = audioURL;
                        audioPreview.style.display = "block";
                        recordAudioButton.textContent = "Record Audio";

                        // Остановить аудио-поток
                        stream.getTracks().forEach((track) => track.stop());
                    });
                })
                .catch((error) => alert("Error accessing microphone: " + error));
        } else {
            mediaRecorder.stop();
        }
    });

    // Съемка фото при добавлении
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