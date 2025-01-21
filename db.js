let db;

export function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("quicknote-db", 1);

        request.onupgradeneeded = (event) => {
            db = event.target.result;

            const noteStore = db.createObjectStore("notes", { keyPath: "id", autoIncrement: true });
            noteStore.createIndex("title", "title", { unique: false });
            noteStore.createIndex("content", "content", { unique: false });
        }

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        }

        request.onerror = (event) => {
            reject('Error' + event.target.result);
        }
    })
}

export function addNote(title, content) {
    const transaction = db.transaction(["notes"], "readwrite");
    const noteStore = transaction.objectStore("notes");

    const note = {
        title: title,
        content: content,
        created: new Date().toISOString()
    }

    noteStore.add(note);
}

export function getNotes() {
    return new Promise((resolve) => {
        const transaction = db.transaction(["notes"], "readonly");
        const noteStore = transaction.objectStore("notes");
        const notes = [];

        noteStore.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;

            if (cursor) {
                notes.push(cursor.value);
                cursor.continue();
            } else {
                resolve(notes);
            }
        }
    })
}
