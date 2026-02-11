const STORAGE_KEY = "keep-notes-clone-v1";
const COLORS = ["#fff", "#f28b82", "#fbbc04", "#fff475", "#ccff90", "#a7ffeb", "#cbf0f8", "#aecbfa", "#d7aefb"];

const state = {
  notes: loadNotes(),
  selectedColor: "#fff",
  query: "",
};

const el = {
  titleInput: document.querySelector("#titleInput"),
  contentInput: document.querySelector("#contentInput"),
  addBtn: document.querySelector("#addNoteBtn"),
  pinnedGrid: document.querySelector("#pinnedGrid"),
  notesGrid: document.querySelector("#notesGrid"),
  template: document.querySelector("#noteTemplate"),
  palette: document.querySelector("#palette"),
  searchInput: document.querySelector("#searchInput"),
};

init();

function init() {
  renderPalette();
  render();

  el.addBtn.addEventListener("click", addNote);
  el.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    render();
  });

  el.contentInput.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      addNote();
    }
  });
}

function loadNotes() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];

  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes));
}

function addNote() {
  const title = el.titleInput.value.trim();
  const content = el.contentInput.value.trim();
  if (!title && !content) return;

  const note = {
    id: crypto.randomUUID(),
    title,
    content,
    color: state.selectedColor,
    pinned: false,
    archived: false,
    createdAt: Date.now(),
  };

  state.notes.unshift(note);
  saveNotes();
  el.titleInput.value = "";
  el.contentInput.value = "";
  render();
}

function renderPalette() {
  el.palette.innerHTML = "";
  COLORS.forEach((color) => {
    const swatch = document.createElement("button");
    swatch.className = `color-swatch${color === state.selectedColor ? " selected" : ""}`;
    swatch.style.backgroundColor = color;
    swatch.type = "button";
    swatch.ariaLabel = `Select ${color} color`;
    swatch.addEventListener("click", () => {
      state.selectedColor = color;
      renderPalette();
    });
    el.palette.appendChild(swatch);
  });
}

function render() {
  const filtered = state.notes.filter((note) => {
    if (note.archived) return false;
    if (!state.query) return true;
    return `${note.title} ${note.content}`.toLowerCase().includes(state.query);
  });

  const pinned = filtered.filter((n) => n.pinned);
  const others = filtered.filter((n) => !n.pinned);

  paintGrid(el.pinnedGrid, pinned, "No pinned notes");
  paintGrid(el.notesGrid, others, "No notes yet");
}

function paintGrid(grid, notes, emptyMessage) {
  grid.innerHTML = "";
  if (!notes.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = emptyMessage;
    grid.appendChild(empty);
    return;
  }

  notes.forEach((note) => {
    const node = el.template.content.firstElementChild.cloneNode(true);
    node.style.backgroundColor = note.color;
    node.querySelector(".note-title").textContent = note.title || "Untitled";
    node.querySelector(".note-content").textContent = note.content;

    const pinBtn = node.querySelector(".pin-btn");
    if (note.pinned) pinBtn.classList.add("active");
    pinBtn.addEventListener("click", () => {
      note.pinned = !note.pinned;
      saveNotes();
      render();
    });

    node.querySelector('[data-action="delete"]').addEventListener("click", () => {
      state.notes = state.notes.filter((n) => n.id !== note.id);
      saveNotes();
      render();
    });

    node.querySelector('[data-action="archive"]').addEventListener("click", () => {
      note.archived = true;
      saveNotes();
      render();
    });

    node.querySelector('[data-action="duplicate"]').addEventListener("click", () => {
      state.notes.unshift({
        ...note,
        id: crypto.randomUUID(),
        pinned: false,
        createdAt: Date.now(),
      });
      saveNotes();
      render();
    });

    grid.appendChild(node);
  });
}
