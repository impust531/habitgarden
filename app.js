const habits = [
  { id: 'reading', name: '読書', theme: 'houseplant' },
  { id: 'exercise', name: '運動', theme: 'cactus' },
  { id: 'python', name: 'Python勉強', theme: 'terrarium' },
];

const STAGES = ['🌱', '🪴', '🌿', '🌳', '🌟'];
const THEME_OFFSET = { houseplant: 0, cactus: 1, terrarium: 2 };
const storeKey = 'habit-garden-v1';

const state = loadState();
rotateMonthIfNeeded(state);
saveState();

const habitList = document.getElementById('habitList');
const shelfList = document.getElementById('shelfList');
const template = document.getElementById('habitCardTemplate');

render();

function render() {
  renderHabits();
  renderShelf();
}

function renderHabits() {
  const now = new Date();
  const nowKey = getDayKey(now);
  const monthKey = getMonthKey(now);
  habitList.innerHTML = '';

  habits.forEach((habit) => {
    const monthData = state.current[monthKey] ?? (state.current[monthKey] = {});
    const days = monthData[habit.id] ?? (monthData[habit.id] = []);
    const givenToday = days.includes(nowKey);

    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector('.habit-name').textContent = habit.name;
    node.querySelector('.plant').textContent = getPlantIcon(habit.theme, days.length);
    node.querySelector('.status').textContent = givenToday
      ? '今日のエネルギーを受け取りました。'
      : '今日はまだエネルギーを与えていません。';

    const btn = node.querySelector('.energy-btn');
    btn.disabled = givenToday;
    if (givenToday) btn.textContent = '✓ 今日は与えました';

    btn.addEventListener('click', () => {
      days.push(nowKey);
      saveState();
      const sparkles = node.querySelector('.sparkles');
      const plant = node.querySelector('.plant');
      sparkles.classList.remove('show');
      void sparkles.offsetWidth;
      sparkles.classList.add('show');
      plant.classList.add('bounce');
      setTimeout(() => plant.classList.remove('bounce'), 420);
      setTimeout(render, 500);
    });

    habitList.appendChild(node);
  });
}

function renderShelf() {
  shelfList.innerHTML = '';
  habits.forEach((habit) => {
    const block = document.createElement('section');
    block.className = 'shelf-block';
    block.innerHTML = `<h3>${habit.name}</h3>`;

    const row = document.createElement('div');
    row.className = 'shelf-row';
    const entries = Object.entries(state.archive[habit.id] || {}).sort((a, b) => b[0].localeCompare(a[0]));

    if (!entries.length) {
      row.innerHTML = '<p class="status">まだ棚に植物はありません。</p>';
    } else {
      entries.forEach(([month, count]) => {
        const item = document.createElement('div');
        item.className = 'shelf-item';
        item.innerHTML = `<div style="font-size:2rem">${getPlantIcon(habit.theme, count)}</div><div class="shelf-date">${month}</div>`;
        row.appendChild(item);
      });
    }

    block.appendChild(row);
    shelfList.appendChild(block);
  });
}

function getPlantIcon(theme, completedDays) {
  const idx = Math.min(4, Math.floor((completedDays / 24) * 5));
  const variants = {
    0: STAGES,
    1: ['🌵', '🌵', '🌵', '🌿', '🌵'],
    2: ['🫙', '🥬', '🪴', '🌿', '🌟'],
  };
  return variants[THEME_OFFSET[theme]][idx];
}

function getDayKey(date) {
  const local = new Date(date);
  if (local.getHours() < 6) local.setDate(local.getDate() - 1);
  return local.toISOString().slice(0, 10);
}

function getMonthKey(date) {
  const local = new Date(date);
  if (local.getHours() < 6) local.setDate(local.getDate() - 1);
  return local.toISOString().slice(0, 7);
}

function rotateMonthIfNeeded(targetState) {
  const monthKey = getMonthKey(new Date());
  for (const key of Object.keys(targetState.current)) {
    if (key !== monthKey) {
      habits.forEach((habit) => {
        const count = (targetState.current[key][habit.id] || []).length;
        targetState.archive[habit.id] = targetState.archive[habit.id] || {};
        targetState.archive[habit.id][key] = count;
      });
      delete targetState.current[key];
    }
  }
}

function loadState() {
  const parsed = JSON.parse(localStorage.getItem(storeKey) || '{}');
  return { current: {}, archive: {}, ...parsed };
}

function saveState() {
  rotateMonthIfNeeded(state);
  localStorage.setItem(storeKey, JSON.stringify(state));
}

document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const isHome = btn.dataset.screen === 'home';
    document.getElementById('homeScreen').classList.toggle('active', isHome);
    document.getElementById('shelfScreen').classList.toggle('active', !isHome);
  });
});
