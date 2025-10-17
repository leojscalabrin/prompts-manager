const STORAGE_KEY = "prompts_storage";

const state = {
  prompts: [],
  selectedId: null
}

const elements = {
  promptTitle: document.getElementById("prompt-title"),
  promptContent: document.getElementById("prompt-content"),
  titleWrapper: document.getElementById("title-wrapper"),
  contentWrapper: document.getElementById("content-wrapper"),
  btnOpen: document.getElementById("btn-open"),
  btnCollapse: document.getElementById("btn-collapse"),
  sidebar: document.querySelector(".sidebar"),
  btnSave: document.getElementById("btn-save"),
  list: document.getElementById("prompt-list"),
  search: document.getElementById("search-input"),
  btnNew: document.getElementById("btn-new"),
  btnCopy: document.getElementById("btn-copy")
};

// Sidebar elements
const sidebar = document.querySelector(".sidebar");

function openSidebar() {
  elements.sidebar.style.display = "flex";
  elements.btnOpen.style.display = "none";

  if (window.innerWidth < 1024) {
    elements.sidebar.style.transform = "translateX(0)";
  }
}

function collapseSidebar() {
  elements.sidebar.style.display = "none";
  elements.btnOpen.style.display = "block";
}

function updateEditableWrapperState(element, wrapper) {
  const hasText = element.textContent.trim().length > 0;
  wrapper.classList.toggle("is-empty", !hasText);
}

function updateAllEditableStates() {
  updateEditableWrapperState(elements.promptTitle, elements.titleWrapper);
  updateEditableWrapperState(elements.promptContent, elements.contentWrapper);
}

function attachAllEditableHandlers() {
  elements.promptTitle.addEventListener("input", function () {
    updateEditableWrapperState(elements.promptTitle, elements.titleWrapper);
  });

  elements.promptContent.addEventListener("input", function () {
    updateEditableWrapperState(elements.promptContent, elements.contentWrapper);
  });
}

function save() {
  const title = elements.promptTitle.textContent.trim();
  const content = elements.promptContent.innerHTML.trim();
  const hasContent = elements.promptContent.textContent.trim();

  if (!title || !hasContent) {
    alert("Both title and content are required.");
    return;
  }

  if (state.selectedId) {
    const existingPrompt = state.prompts.find(p => p.id === state.selectedId);
    if (existingPrompt) {
      existingPrompt.title = title || "Sem título";
      existingPrompt.content = content || "Sem conteúdo";
    }
  } else {
    const newPrompt = {
      id: Date.now().toString(36),
      title,
      content,
    };
    console.log("Adicionando novo prompt:", newPrompt);
    state.prompts.unshift(newPrompt);
    state.selectedId = newPrompt.id;
  }

  renderList(elements.search.value);
  persist();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.prompts));
  } catch (error) {
    console.log("Error saving to localStorage", error);
  }
}

function load() {
  try {
    const storage = localStorage.getItem(STORAGE_KEY);
    state.prompts = storage ? JSON.parse(storage) : [];
    state.selectedId = null;

  } catch (error) {
    console.log("Error loading from localStorage", error);
  }
}

function createPromptItem(prompt) {
  if (!prompt.id || typeof prompt.id !== "string") {
    console.error("Prompt com ID inválido:", prompt);
    prompt.id = Date.now().toString(36);
  }

  const html = `
    <li class="prompt-line" data-id="${prompt.id}" data-action="select" style="pointer-events: auto; position: relative;">
      <div class="prompt-item-content">
        <span class="prompt-item-title">${prompt.title || "Sem título"}</span>
        <span class="prompt-item-description">${prompt.content || "Sem conteúdo"}</span>
      </div>
      <button class="btn-icon" title="Remover" data-action="remove" style="pointer-events: auto;">
        <img src="assets/remove.svg" alt="Remover" class="icon icon-trash" style="pointer-events: auto;">
      </button>
    </li>
  `;
  return html;
}

function renderList(filterText = "") {
  const filteredPrompts = state.prompts.filter(prompt => 
    prompt.title && typeof prompt.title === "string" && 
    prompt.title.toLowerCase().includes(filterText.toLowerCase())
  ).map((p) => createPromptItem(p)).join("");
  
  elements.list.innerHTML = filteredPrompts;
}


function newPrompt() {
  state.selectedId = null;
  elements.promptTitle.textContent = "";
  elements.promptContent.textContent = "";
  updateAllEditableStates();
  elements.promptTitle.focus();
}

function copySelected() {
  try {
    const content = elements.promptContent

    if (!navigator.clipboard) {
      console.error("Clipboard API não suportada neste ambiente.")
      return
    }

    navigator.clipboard.writeText(content.innerText)
    alert("Copiado para a área de transferência!")
  } catch (error) {
    console.log("Error trying to copy: ", error)
  }
}

//Eventos
elements.btnSave.addEventListener("click", save);
elements.btnNew.addEventListener("click", newPrompt);
elements.btnCopy.addEventListener("click", copySelected);

elements.search.addEventListener("input", function(event) {
  renderList(event.target.value);
});

elements.list.addEventListener("click", function(event) {
  const removeBtn = event.target.closest("button[data-action='remove']");
  let item = event.target.closest("li");

  if (!item && removeBtn) {
    item = removeBtn.closest("li");
  }

  if (!item) {
    return;
  }

  const id = item.getAttribute("data-id");
  if (!id) {
    return;
  }

  state.selectedId = id;

  if (removeBtn) {
    state.prompts = state.prompts.filter(p => p.id !== id);
    renderList(elements.search.value);
    persist();
    newPrompt(); // Opcional: Limpa os campos após remoção
    return;
  }

  if (item.getAttribute("data-action") === "select") {
    const prompt = state.prompts.find(p => p.id === id);

    if (prompt) {
      elements.promptTitle.textContent = prompt.title;
      elements.promptContent.innerHTML = prompt.content;
      updateAllEditableStates();
    }
  }
});

function init() {
  const storedPrompts = localStorage.getItem(STORAGE_KEY);
  if (storedPrompts) {
    state.prompts = JSON.parse(storedPrompts);
  }
  load();
  renderList("");
  attachAllEditableHandlers();
  updateAllEditableStates();

  elements.btnOpen.addEventListener("click", openSidebar);
  elements.btnCollapse.addEventListener("click", collapseSidebar);
}

document.addEventListener("DOMContentLoaded", init);
