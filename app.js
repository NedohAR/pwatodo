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
                <div class="note-actions">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </div>
                <div class="edit-mode" style="display: none;">
                    <input type="text" class="edit-title" value="${note.title}" />
                    <input type="text" class="edit-content" value="${note.content}" />
                    <button class="save-btn">Save</button>
                </div>
            `;

            noteList.appendChild(noteItem);

            // Редактирование заметки
            noteItem.querySelector(".edit-btn").addEventListener("click", () => {
                const editMode = noteItem.querySelector(".edit-mode");
                editMode.style.display = "block";  // Показываем поля для редактирования
                noteItem.querySelector(".edit-btn").style.display = "none"; // Скрываем кнопку "Edit"

                // Сохранение изменений
                noteItem.querySelector(".save-btn").addEventListener("click", () => {
                    const newTitle = noteItem.querySelector(".edit-title").value.trim();
                    const newContent = noteItem.querySelector(".edit-content").value.trim();

                    if (newTitle && newContent) {
                        updateNote(note.id, newTitle, newContent);
                        displayNotes(); // Перерисовываем заметки
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

    openDatabase().then(() => {
        displayNotes();

        // Добавление новой заметки
        addNoteButton.addEventListener("click", () => {
            const title = noteTitleInput.value.trim();
            const content = noteContentInput.value.trim();

            if (title && content) {
                // Добавляем заметку в базу данных
                addNote(title, content).then(() => {
                    displayNotes(); // Обновляем отображение списка заметок
                    noteTitleInput.value = ""; // Очищаем поле заголовка
                    noteContentInput.value = ""; // Очищаем поле контента
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


