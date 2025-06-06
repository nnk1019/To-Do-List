const container = document.getElementById('completedTasksContainer');
const toggleBtn = document.getElementById('toggleCollapseBtn');

// Load completed tasks from localStorage
let completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];

function render() {
  container.innerHTML = '';

  if (completedTasks.length === 0) {
    container.textContent = 'No completed tasks yet.';
    return;
  }

  // Group completed tasks by category
  const grouped = completedTasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {});

  for (const [category, tasks] of Object.entries(grouped)) {
    const catSection = document.createElement('section');
    catSection.className = 'mb-4';

const catTitleRow = document.createElement('div');
catTitleRow.className = 'd-flex align-items-center mb-2';

const leftGroup = document.createElement('div');
leftGroup.className = 'd-flex align-items-center';

const catTitle = document.createElement('h3');
catTitle.textContent = category;
catTitle.className = 'mb-0';

const collapseBtn = document.createElement('button');
collapseBtn.className = 'btn btn-sm btn-outline-secondary ms-2';
collapseBtn.textContent = '-';

let isCollapsed = false;
collapseBtn.addEventListener('click', () => {
  isCollapsed = !isCollapsed;
  collapsibleDiv.style.display = isCollapsed ? 'none' : '';
  collapseBtn.textContent = isCollapsed ? '+' : '-';
});

leftGroup.appendChild(catTitle);
leftGroup.appendChild(collapseBtn);

const deleteCategoryBtn = document.createElement('button');
deleteCategoryBtn.className = 'btn btn-danger btn-sm ms-auto';
deleteCategoryBtn.textContent = 'Delete Category';

deleteCategoryBtn.addEventListener('click', () => {
  if (confirm(`Delete all completed tasks in "${category}"?`)) {
    // Remove all tasks in this category from completedTasks
    completedTasks = completedTasks.filter(task => task.category !== category);
    localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
    render();
  }
});

catTitleRow.appendChild(leftGroup);
catTitleRow.appendChild(deleteCategoryBtn);
catSection.appendChild(catTitleRow);

// Collapsible content
const collapsibleDiv = document.createElement('div');
collapsibleDiv.className = 'collapsible-section';

    const ul = document.createElement('ul');
    ul.className = 'list-group';

    tasks.forEach((task) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex align-items-center';

      const taskText = document.createElement('span');
      taskText.textContent = task.task;

      const timestamp = document.createElement('span');
      timestamp.className = 'completed-task-time';
      const dateObj = new Date(task.completedAt);
      timestamp.textContent = dateObj.toLocaleString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: getTimeFormat()
});

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-sm btn-danger ms-3';
      deleteBtn.textContent = 'X';

      deleteBtn.addEventListener('click', () => {
        completedTasks = completedTasks.filter(
          (t) => !(t.task === task.task && t.completedAt === task.completedAt && t.category === task.category)
        );
        localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
        render();
      });

      // Flex alignment for timestamp
      const left = document.createElement('span');
      left.className = 'flex-grow-1';
      left.appendChild(taskText);

      li.appendChild(left);
      li.appendChild(timestamp);
      li.appendChild(deleteBtn);
      ul.appendChild(li);
    });

    collapsibleDiv.appendChild(ul);
    catSection.appendChild(collapsibleDiv);
    container.appendChild(catSection);
  }
}


render();

// Toggle theme functionality
const themeBtn = document.getElementById('toggleThemeBtn');
function updateThemeBtnText() {
  themeBtn.textContent = document.body.classList.contains('night-mode') ? 'Day' : 'Night';
}
themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('night-mode');
  localStorage.setItem('theme', document.body.classList.contains('night-mode') ? 'night' : 'day');
  updateThemeBtnText();
});

if (localStorage.getItem('theme') === 'night') {
  document.body.classList.add('night-mode');
}
updateThemeBtnText();

// Time format toggle
const timeFormatBtn = document.getElementById('toggleTimeFormatBtn');
function getTimeFormat() {
  return localStorage.getItem('timeFormat') === '24' ? false : true; // hour12: true for 12h, false for 24h
}
function updateTimeFormatBtnText() {
  timeFormatBtn.textContent = getTimeFormat() ? '24h' : '12h';
}
timeFormatBtn.addEventListener('click', () => {
  const current = localStorage.getItem('timeFormat');
  localStorage.setItem('timeFormat', current === '24' ? '12' : '24');
  updateTimeFormatBtnText();
  render();
});
updateTimeFormatBtnText();

