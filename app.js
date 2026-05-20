const habits = [
  { id: 'reading', name: '読書', plant: 'coffeetree' },
  { id: 'exercise', name: '運動', plant: 'hawortia' },
  { id: 'python', name: 'Python', plant: 'jewelorchid' },
];

const MAX_GROWTH_DAYS = 30;
const imageCache = new Map();
const PLANT_IMAGES = {
  coffeetree: [
    'images/coffeetree-1.png',
    'images/coffeetree-2.png',
    'images/coffeetree-3.png',
    'images/coffeetree-4.png',
    'images/coffeetree-5.png',
  ],
  hawortia: [
    'images/hawortia-1.png',
    'images/hawortia-2.png',
    'images/hawortia-3.png',
    'images/hawortia-4.png',
    'images/hawortia-5.png',
  ],
  jewelorchid: [
    'images/jewelorchid-1.png',
    'images/jewelorchid-2.png',
    'images/jewelorchid-3.png',
    'images/jewelorchid-4.png',
    'images/jewelorchid-5.png',
  ],
};
const storeKey = 'habit-garden-v1';

const state = loadState();
rotateMonthIfNeeded(state);
saveState();

const habitList = document.getElementById('habitList');
const calendarTitle = document.getElementById('calendarTitle');
const calendarGrid = document.getElementById('calendarGrid');
const calendarDetail = document.getElementById('calendarDetail');
const shelfList = document.getElementById('shelfList');
const template = document.getElementById('habitCardTemplate');
let selectedDayKey = getDayKey(new Date());

render();

function render() {
  renderHabits();
  renderCalendar();
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
    setPlantImage(node.querySelector('.plant'), habit, days.length);
    node.querySelector('.status').textContent = givenToday
      ? '今日の記録は完了しました。'
      : '今日はまだ記録していません。';

    const btn = node.querySelector('.energy-btn');
    btn.disabled = givenToday;
    if (givenToday) btn.textContent = '今日の分は記録済み';

    btn.addEventListener('click', () => {
      days.push(nowKey);
      selectedDayKey = nowKey;
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

function renderCalendar() {
  const now = new Date();
  const monthKey = getMonthKey(now);
  const [year, month] = monthKey.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const monthData = state.current[monthKey] || {};
  const todayKey = getDayKey(now);

  calendarTitle.textContent = `${year}年${month}月`;
  calendarGrid.innerHTML = '';

  for (let i = 0; i < firstDay.getDay(); i++) {
    const blank = document.createElement('div');
    blank.className = 'calendar-day blank';
    calendarGrid.appendChild(blank);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month - 1, day);
    const dayKey = formatLocalDate(date);
    const completedHabits = habits.filter((habit) => (monthData[habit.id] || []).includes(dayKey));

    const cell = document.createElement('article');
    cell.className = 'calendar-day';
    if (dayKey === todayKey) cell.classList.add('today');
    if (dayKey === selectedDayKey) cell.classList.add('selected');
    cell.tabIndex = 0;
    cell.setAttribute('aria-label', `${month}月${day}日 ${completedHabits.length}件記録`);

    const number = document.createElement('div');
    number.className = 'calendar-date';
    number.textContent = day;
    cell.appendChild(number);

    const marks = document.createElement('div');
    marks.className = 'calendar-marks';
    completedHabits.forEach((habit) => {
      const mark = document.createElement('span');
      mark.className = `calendar-mark ${habit.id}`;
      mark.title = habit.name;
      marks.appendChild(mark);
    });
    cell.appendChild(marks);

    cell.addEventListener('click', () => selectCalendarDay(dayKey));
    cell.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectCalendarDay(dayKey);
      }
    });

    calendarGrid.appendChild(cell);
  }

  renderCalendarDetail(monthKey);
}

function selectCalendarDay(dayKey) {
  selectedDayKey = dayKey;
  renderCalendar();
}

function renderCalendarDetail(monthKey) {
  const monthData = state.current[monthKey] || {};
  const selectedDate = parseDayKey(selectedDayKey);
  const completedCount = habits.filter((habit) => (monthData[habit.id] || []).includes(selectedDayKey)).length;

  calendarDetail.innerHTML = '';

  const title = document.createElement('h3');
  title.textContent = `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日の記録`;
  calendarDetail.appendChild(title);

  const summary = document.createElement('p');
  summary.className = 'calendar-summary';
  summary.textContent = `${completedCount}/${habits.length} 件完了`;
  calendarDetail.appendChild(summary);

  const list = document.createElement('ul');
  list.className = 'calendar-detail-list';
  habits.forEach((habit) => {
    const done = (monthData[habit.id] || []).includes(selectedDayKey);
    const item = document.createElement('li');
    item.className = done ? 'done' : 'missed';
    item.innerHTML = `<span>${habit.name}</span><strong aria-label="${done ? '完了' : '未実行'}">${done ? '🌱' : '-'}</strong>`;
    list.appendChild(item);
  });
  calendarDetail.appendChild(list);
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

        const plant = document.createElement('img');
        plant.className = 'shelf-plant';
        plant.alt = `${habit.name} ${month} の最終形態`;
        setPlantSource(plant, getPlantImage(habit.plant, count));
        item.appendChild(plant);

        const date = document.createElement('div');
        date.className = 'shelf-date';
        date.textContent = month;
        item.appendChild(date);

        row.appendChild(item);
      });
    }

    block.appendChild(row);
    shelfList.appendChild(block);
  });
}

function setPlantImage(image, habit, completedDays) {
  image.alt = `${habit.name} ${completedDays}/${MAX_GROWTH_DAYS}日`;
  setPlantSource(image, getPlantImage(habit.plant, completedDays));
}

function getPlantImage(plant, completedDays) {
  return PLANT_IMAGES[plant][getGrowthStage(completedDays)];
}

function setPlantSource(image, assetPath) {
  image.dataset.asset = assetPath;
  loadPlantDataUrl(assetPath).then((dataUrl) => {
    if (image.dataset.asset === assetPath) image.src = dataUrl;
  });
}

async function loadPlantDataUrl(assetPath) {
  if (imageCache.has(assetPath)) return imageCache.get(assetPath);
  const response = await fetch(assetPath);
  const base64 = (await response.text()).trim();
  const dataUrl = `data:image/webp;base64,${base64}`;
  imageCache.set(assetPath, dataUrl);
  return dataUrl;
}

function getGrowthStage(completedDays) {
  if (completedDays >= MAX_GROWTH_DAYS) return 4;
  if (completedDays >= 22) return 3;
  if (completedDays >= 15) return 2;
  if (completedDays >= 8) return 1;
  return 0;
}

function getDayKey(date) {
  const local = new Date(date);
  if (local.getHours() < 6) local.setDate(local.getDate() - 1);
  return formatLocalDate(local);
}

function getMonthKey(date) {
  const local = new Date(date);
  if (local.getHours() < 6) local.setDate(local.getDate() - 1);
  return formatLocalMonth(local);
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLocalMonth(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function parseDayKey(dayKey) {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day);
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
    const screen = btn.dataset.screen;
    document.getElementById('homeScreen').classList.toggle('active', screen === 'home');
    document.getElementById('calendarScreen').classList.toggle('active', screen === 'calendar');
    document.getElementById('shelfScreen').classList.toggle('active', screen === 'shelf');
  });
});

