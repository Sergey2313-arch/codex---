const STORAGE_KEY = 'todo-flow-tasks-v4';
const PROFILE_KEY = 'todo-flow-profile-v1';

const state = {
  todos: loadTodos(),
  filter: 'all',
  query: '',
  sort: 'new',
};

const intro = document.getElementById('intro');
const introForm = document.getElementById('intro-form');
const nameInput = document.getElementById('name-input');
const app = document.getElementById('app');
const helloText = document.getElementById('hello-text');

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

introForm.addEventListener('submit', onStart);
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

boot();
render();

function boot() {
  const profile = loadProfile();

  if (profile.started) {
    applyGreeting(profile.name);
    showAppImmediately();
    return;
  }

  intro.hidden = false;
  nameInput.focus();
}

function onStart(event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  saveProfile({ started: true, name });
  applyGreeting(name);

  intro.classList.add('intro--leave');
  intro.addEventListener(
    'animationend',
    () => {
      intro.hidden = true;
      showAppImmediately();
    },
    { once: true }
  );
}

function applyGreeting(name) {
  helloText.textContent = name
    ? `${name}, планируй дела и ничего не теряй.`
    : 'Планируй дела и ничего не теряй.';
}

function showAppImmediately() {
  app.classList.remove('app--hidden');
  input.focus();
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { started: false, name: '' };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { started: false, name: '' };

    return {
      started: Boolean(parsed.started),
      name: typeof parsed.name === 'string' ? parsed.name : '',
    };
  } catch {
    return { started: false, name: '' };
  }
}

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
  persistTodos();
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
    persistTodos();
    render();
    return;
  }

  if (target.classList.contains('remove-btn')) {
    state.todos = state.todos.filter((todo) => todo.id !== id);
    persistTodos();
    render();
    return;
  }

  if (target.classList.contains('edit-btn')) {
    const current = state.todos.find((todo) => todo.id === id);
    if (!current) return;

    const edited = prompt('Измени задачу:', current.text);
    if (edited === null) return;

    const text = edited.trim();
    if (!text) return;

    state.todos = state.todos.map((todo) => (todo.id === id ? { ...todo, text } : todo));
    persistTodos();
    render();
  }
}

function clearCompleted() {
  state.todos = state.todos.filter((todo) => !todo.done);
  persistTodos();
  render();
}

function toggleAll() {
  const hasActive = state.todos.some((todo) => !todo.done);
  state.todos = state.todos.map((todo) => ({ ...todo, done: hasActive }));
  persistTodos();
  render();
}

function persistTodos() {
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
  let filtered = [...state.todos];

  if (state.filter === 'active') filtered = filtered.filter((todo) => !todo.done);
  if (state.filter === 'done') filtered = filtered.filter((todo) => todo.done);
  if (state.query) filtered = filtered.filter((todo) => todo.text.toLowerCase().includes(state.query));

  switch (state.sort) {
    case 'old':
      filtered.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
      break;
    case 'az':
      filtered.sort((a, b) => a.text.localeCompare(b.text, 'ru'));
      break;
    case 'za':
      filtered.sort((a, b) => b.text.localeCompare(a.text, 'ru'));
      break;
    default:
      filtered.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }

  return filtered;
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
  stats.textContent = `Всего: ${total} • Активные: ${active} • Выполнено: ${done}`;
}
