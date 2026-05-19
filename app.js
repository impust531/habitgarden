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
const calendarGrid = document.getElementById('calendarGrid');
const calendarMonthLabel = document.getElementById('calendarMonthLabel');
const dayDetail = document.getElementById('dayDetail');
const weekdaysContainer = document.querySelector('.calendar-weekdays');

let activeMonth = new Date();
activeMonth.setDate(1);
let selectedDayKey = getDayKey(new Date());

setupCalendarWeekdays();
render();

function render() {
  renderHabits();
  renderShelf();
  renderCalendar();
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

function renderCalendar() {
  const monthDate = new Date(activeMonth);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  calendarMonthLabel.textContent = `${year}年 ${month + 1}月`;
  calendarGrid.innerHTML = '';

  const monthStart = new Date(year, month, 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  for (let i = 0; i < 42; i += 1) {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    const dayKey = getDayKey(day);

    const button = document.createElement('button');
    button.className = 'calendar-day';
    if (day.getMonth() !== month) button.classList.add('other-month');
    if (dayKey === getDayKey(new Date())) button.classList.add('today');
    if (dayKey === selectedDayKey) button.classList.add('selected');

    button.innerHTML = `<span class="day-num">${day.getDate()}</span><span class="day-indicators"></span>`;
    fillIndicators(button.querySelector('.day-indicators'), dayKey);

    button.addEventListener('click', () => {
      selectedDayKey = dayKey;
      dayDetail.classList.add('fade');
      setTimeout(() => {
        renderCalendar();
        dayDetail.classList.remove('fade');
      }, 120);
    });

    calendarGrid.appendChild(button);
  }

  renderDayDetail();
}

function fillIndicators(container, dayKey) {
  const monthKey = dayKey.slice(0, 7);
  const monthData = state.current[monthKey] || {};

  habits.forEach((habit) => {
    const days = monthData[habit.id] || [];
    if (days.includes(dayKey)) {
      const dot = document.createElement('span');
      dot.className = `indicator-dot ${habit.id}`;
      dot.title = `${habit.name} 完了`;
      container.appendChild(dot);
    }
  });
}

function renderDayDetail() {
  const date = new Date(`${selectedDayKey}T12:00:00`);
  const monthKey = selectedDayKey.slice(0, 7);
  const monthData = state.current[monthKey] || {};

  const completed = habits
    .filter((habit) => (monthData[habit.id] || []).includes(selectedDayKey))
    .map((habit) => `${habit.name} 完了`);

  const lines = completed.length ? completed.map((item) => `<p>${item}</p>`).join('') : '<p>ゆっくり休んだ日でした。</p>';
  dayDetail.innerHTML = `<h3>${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日</h3>${lines}`;
}

function setupCalendarWeekdays() {
  ['日', '月', '火', '水', '木', '金', '土'].forEach((day) => {
    const el = document.createElement('div');
    el.className = 'calendar-weekday';
    el.textContent = day;
    weekdaysContainer.appendChild(el);
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

document.getElementById('prevMonthBtn').addEventListener('click', () => {
  activeMonth.setMonth(activeMonth.getMonth() - 1);
  renderCalendar();
});

document.getElementById('nextMonthBtn').addEventListener('click', () => {
  activeMonth.setMonth(activeMonth.getMonth() + 1);
  renderCalendar();
});

document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const screen = btn.dataset.screen;
    document.getElementById('homeScreen').classList.toggle('active', screen === 'home');
    document.getElementById('shelfScreen').classList.toggle('active', screen === 'shelf');
    document.getElementById('calendarScreen').classList.toggle('active', screen === 'calendar');
  });
});
