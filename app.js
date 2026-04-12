const STORAGE_KEY = 'todo-list-items-v1';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const emptyState = document.getElementById('todo-empty');
const clearCompletedButton = document.getElementById('clear-completed');

let todos = loadTodos();
render();

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  todos.unshift({
    id: crypto.randomUUID(),
    text,
    done: false,
  });

  input.value = '';
  saveAndRender();
});

list.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const item = target.closest('.todo-item');
  if (!item) return;

  const { id } = item.dataset;
  if (!id) return;

  if (target.matches('input[type="checkbox"]')) {
    todos = todos.map((todo) =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    );
    saveAndRender();
    return;
  }

  if (target.matches('.todo-remove')) {
    todos = todos.filter((todo) => todo.id !== id);
    saveAndRender();
  }
});

clearCompletedButton.addEventListener('click', () => {
  todos = todos.filter((todo) => !todo.done);
  saveAndRender();
});

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  render();
}

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function render() {
  list.innerHTML = '';

  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.done ? ' completed' : ''}`;
    li.dataset.id = todo.id;

    li.innerHTML = `
      <input type="checkbox" ${todo.done ? 'checked' : ''} aria-label="Отметить задачу" />
      <span class="todo-text"></span>
      <button type="button" class="todo-remove" aria-label="Удалить задачу">✕</button>
    `;

    li.querySelector('.todo-text').textContent = todo.text;
    list.append(li);
  });

  emptyState.hidden = todos.length !== 0;
}
