let db;

export function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("noteApp", 1);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            const notesStore = db.createObjectStore("notes", { keyPath: "id", autoIncrement: true });
            notesStore.createIndex("title", "title", { unique: false });
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve();
        };

        request.onerror = (event) => {
            reject("Database error: " + event.target.errorCode);
        };
    });
}

export function addNote(title, content, photo = null, audio = null) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("notes", "readwrite");
        const store = transaction.objectStore("notes");

        const note = {
            title,
            content,
            photo,
            audio,
            created: new Date().toISOString(),
        };

        const request = store.add(note);

        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e);
    });
}

export function getNotes() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("notes", "readonly");
        const store = transaction.objectStore("notes");

        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e);
    });
}

export function deleteNote(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("notes", "readwrite");
        const store = transaction.objectStore("notes");

        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e);
    });
}

export function updateNote(id, newTitle, newContent, newPhoto, newAudio) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("notes", "readwrite");
        const store = transaction.objectStore("notes");

        const request = store.get(id);

        request.onsuccess = () => {
            const note = request.result;
            note.title = newTitle;
            note.content = newContent;
            note.photo = newPhoto || note.photo;
            note.audio = newAudio || note.audio;
            store.put(note);
            resolve();
        };

        request.onerror = (e) => reject(e);
    });
}