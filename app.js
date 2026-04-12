const STORAGE_KEY = 'todo-list-pro-v2';

const state = {
  todos: loadTodos(),
  filter: 'all',
  query: '',
  sort: 'new',
};

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const empty = document.getElementById('todo-empty');
const stats = document.getElementById('stats');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const clearCompletedButton = document.getElementById('clear-completed');
const toggleAllButton = document.getElementById('toggle-all');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const template = document.getElementById('todo-item-template');

form.addEventListener('submit', onCreate);
list.addEventListener('click', onListClick);
searchInput.addEventListener('input', () => {
  state.query = searchInput.value.trim().toLowerCase();
  render();
});
sortSelect.addEventListener('change', () => {
  state.sort = sortSelect.value;
  render();
});
clearCompletedButton.addEventListener('click', clearCompleted);
toggleAllButton.addEventListener('click', toggleAll);

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    filterButtons.forEach((btn) => {
      const isActive = btn === button;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
    render();
  });
});

render();

function onCreate(event) {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  state.todos.unshift({
    id: crypto.randomUUID(),
    text,
    done: false,
    createdAt: Date.now(),
  });

  input.value = '';
  persist();
  render();
}

function onListClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const item = target.closest('.todo-item');
  if (!item?.dataset.id) return;
  const id = item.dataset.id;

  if (target.classList.contains('todo-checkbox')) {
    state.todos = state.todos.map((todo) =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    );
    persist();
    render();
    return;
  }

  if (target.classList.contains('remove-btn')) {
    state.todos = state.todos.filter((todo) => todo.id !== id);
    persist();
    render();
    return;
  }

  if (target.classList.contains('edit-btn')) {
    const current = state.todos.find((todo) => todo.id === id);
    if (!current) return;

    const next = prompt('Измени задачу:', current.text);
    if (next === null) return;

    const text = next.trim();
    if (!text) return;

    state.todos = state.todos.map((todo) => (todo.id === id ? { ...todo, text } : todo));
    persist();
    render();
  }
}

function clearCompleted() {
  state.todos = state.todos.filter((todo) => !todo.done);
  persist();
  render();
}

function toggleAll() {
  const hasActive = state.todos.some((todo) => !todo.done);
  state.todos = state.todos.map((todo) => ({ ...todo, done: hasActive }));
  persist();
  render();
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
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

function getVisibleTodos() {
  let list = [...state.todos];

  if (state.filter === 'active') list = list.filter((todo) => !todo.done);
  if (state.filter === 'done') list = list.filter((todo) => todo.done);
  if (state.query) {
    list = list.filter((todo) => todo.text.toLowerCase().includes(state.query));
  }

  switch (state.sort) {
    case 'old':
      list.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
      break;
    case 'az':
      list.sort((a, b) => a.text.localeCompare(b.text, 'ru'));
      break;
    case 'za':
      list.sort((a, b) => b.text.localeCompare(a.text, 'ru'));
      break;
    default:
      list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      break;
  }

  return list;
}

function render() {
  list.innerHTML = '';
  const visible = getVisibleTodos();

  visible.forEach((todo) => {
    const fragment = template.content.cloneNode(true);
    const item = fragment.querySelector('.todo-item');
    const checkbox = fragment.querySelector('.todo-checkbox');
    const text = fragment.querySelector('.todo-text');

    item.dataset.id = todo.id;
    item.classList.toggle('is-done', todo.done);
    checkbox.checked = todo.done;
    text.textContent = todo.text;

    list.append(fragment);
  });

  empty.hidden = visible.length > 0;

  const total = state.todos.length;
  const done = state.todos.filter((todo) => todo.done).length;
  const active = total - done;
  stats.textContent = `Всего: ${total} • Активных: ${active} • Выполненных: ${done}`;
}
