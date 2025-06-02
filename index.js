const categoriesContainer = document.getElementById('categoriesContainer');
const newCategoryInput = document.getElementById('newCategoryInput');
const createCategoryBtn = document.getElementById('createCategoryBtn');

// Load categories from localStorage on page load
let categories = JSON.parse(localStorage.getItem('categories')) || [];
renderCategories();

// Create new category handler
createCategoryBtn.addEventListener('click', () => {
  const categoryName = newCategoryInput.value.trim();
  if (!categoryName) {
    alert('Please enter a category name!');
    return;
  }
  if (categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
    alert('Category already exists!');
    return;
  }
  const newCategory = {
    id: `cat-${Date.now()}`,
    name: categoryName,
    tasks: []
  };
  categories.push(newCategory);
  saveCategories();
  renderCategories();
  newCategoryInput.value = '';
});

function renderCategories() {
  categoriesContainer.innerHTML = '';

  categories.forEach(category => {
    // Create category section
    const categorySection = document.createElement('div');
    categorySection.className = 'mb-5';
    categorySection.id = category.id;

    categorySection.innerHTML = `
      <div class="d-flex align-items-center mb-2">
        <div class="d-flex align-items-center">
          <h3 class="mb-0">${category.name}</h3>
          <button class="btn btn-outline-secondary btn-sm ms-2 collapse-category-btn">-</button>
        </div>
        <div class="d-flex align-items-center ms-auto">
          <div class="form-check mb-0 me-2">
            <input class="form-check-input one-time-checkbox" type="checkbox" id="oneTimeTask-${category.id}">
            <label class="form-check-label" for="oneTimeTask-${category.id}">
              One-time task
            </label>
          </div>
          <button class="btn btn-danger btn-sm delete-category-btn">Delete Category</button>
        </div>
      </div>
      <div class="category-content">
        <div class="input-group mb-2">
          <select class="form-select task-reset-mode" style="max-width: 120px;">
            <option value="interval">Interval</option>
            <option value="time" selected>Time of Day</option>
          </select>
          <input type="number" class="form-control task-reset-amount" min="1" value="24" style="max-width: 80px;" placeholder="Time">
          <select class="form-select task-reset-unit" style="max-width: 100px;">
            <option value="minutes">min</option>
            <option value="hours" selected>hr</option>
            <option value="days">day</option>
          </select>
          <input type="time" class="form-control task-reset-time" style="max-width: 120px; display: none;">
          <input type="text" class="form-control task-input" placeholder="Enter a task">
          <button class="btn btn-primary add-task-btn">Add</button>
        </div>
        <ul class="list-group task-list"></ul>
      </div>
    `;

    // Add collapse functionality
    const collapseBtn = categorySection.querySelector('.collapse-category-btn');
    const categoryContent = categorySection.querySelector('.category-content');
    let collapsed = false;
    collapseBtn.addEventListener('click', () => {
      collapsed = !collapsed;
      categoryContent.style.display = collapsed ? 'none' : '';
      collapseBtn.textContent = collapsed ? '+' : '-';
    });

    // Append the category section to the container
    categoriesContainer.appendChild(categorySection);

    // Select form elements
    const input = categorySection.querySelector('.task-input');
    const addBtn = categorySection.querySelector('.add-task-btn');
    const resetMode = categorySection.querySelector('.task-reset-mode');
    const resetAmount = categorySection.querySelector('.task-reset-amount');
    const resetUnit = categorySection.querySelector('.task-reset-unit');
    const resetTime = categorySection.querySelector('.task-reset-time');
    const oneTimeCheckbox = categorySection.querySelector('.one-time-checkbox');
    const list = categorySection.querySelector('.task-list');
    const deleteCategoryBtn = categorySection.querySelector('.delete-category-btn');

    // Show/hide reset inputs based on mode
    resetMode.addEventListener('change', () => {
      if (resetMode.value === 'interval') {
        resetAmount.style.display = '';
        resetUnit.style.display = '';
        resetTime.style.display = 'none';
      } else {
        resetAmount.style.display = 'none';
        resetUnit.style.display = 'none';
        resetTime.style.display = '';
      }
    });

    // Initialize reset mode visibility
    resetMode.dispatchEvent(new Event('change'));

    // Render tasks for this category
    category.tasks.forEach(task => {
      addTaskToDOM(list, category.id, task);
      if (task.completed && task.completedAt) {
        setTaskResetTimeout(category.id, task.id);
      }
    });

    // Add new task handler
    addBtn.addEventListener('click', () => {
      const taskText = input.value.trim();
      const isOneTime = oneTimeCheckbox.checked;
      const mode = resetMode.value;
      let resetValue = null;

      if (mode === 'interval') {
        let amount = parseInt(resetAmount.value, 10);
        let unit = resetUnit.value;
        if (!isNaN(amount) && amount > 0) {
          if (unit === 'minutes') resetValue = amount * 60 * 1000;
          else if (unit === 'hours') resetValue = amount * 60 * 60 * 1000;
          else if (unit === 'days') resetValue = amount * 24 * 60 * 60 * 1000;
        }
      } else if (mode === 'time') {
        resetValue = resetTime.value; // e.g. "13:00"
      }

      if (!taskText) {
        alert('Please enter a task!');
        return;
      }

      // Check for duplicates in this category
      if (category.tasks.some(t => t.text.toLowerCase() === taskText.toLowerCase())) {
        alert('Task already exists in this category!');
        return;
      }

      const newTask = {
        id: `task-${Date.now()}`,
        text: taskText,
        completed: false,
        completedAt: null,
        resetMode: mode,
        resetValue: isOneTime ? null : resetValue,
        oneTime: isOneTime
      };
      const catIndex = categories.findIndex(c => c.id === category.id);
      if (catIndex > -1) {
        categories[catIndex].tasks.push(newTask);
        saveCategories();
        addTaskToDOM(list, category.id, newTask);
        input.value = '';
        oneTimeCheckbox.checked = false;
      }
    });

    // Delete category handler
    deleteCategoryBtn.addEventListener('click', () => {
      if (confirm(`Delete category "${category.name}"? This will delete all its tasks.`)) {
        categories = categories.filter(c => c.id !== category.id);
        saveCategories();
        renderCategories();
      }
    });

    // Task checkbox and delete delegation
    list.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li) return;

      const taskId = li.dataset.taskId;
      const catId = category.id;
      const catIndex = categories.findIndex(c => c.id === catId);
      if (catIndex === -1) return;
      const taskIndex = categories[catIndex].tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return;
      const task = categories[catIndex].tasks[taskIndex];

      // Checkbox toggle
      if (e.target.classList.contains('task-checkbox')) {
        if (e.target.checked) {
          task.completed = true;
          task.completedAt = new Date().toISOString();
          saveCategories();

          // Save completed task record separately
          let completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];
          completedTasks.push({
            task: task.text,
            completedAt: task.completedAt,
            category: category.name
          });
          localStorage.setItem('completedTasks', JSON.stringify(completedTasks));

          li.querySelector('.task-text').classList.add('text-decoration-line-through');
          setTaskResetTimeout(catId, taskId);
        } else {
          // Unchecked manually before timeout
          task.completed = false;
          task.completedAt = null;
          saveCategories();
          li.querySelector('.task-text').classList.remove('text-decoration-line-through');
        }
        saveCategories();
      }

      // Delete task button
      if (e.target.classList.contains('delete-btn')) {
        if (confirm('Delete this task?')) {
          categories[catIndex].tasks.splice(taskIndex, 1);
          saveCategories();
          li.remove();
        }
      }
    });
  });
}

// Function to add a task to the DOM
function addTaskToDOM(list, categoryId, task) {
  const li = document.createElement('li');
  li.className = 'list-group-item justify-content-between align-items-center';
  li.dataset.taskId = task.id;

  li.innerHTML = `
    <input type="checkbox" class="form-check-input me-2 task-checkbox" ${task.completed ? 'checked' : ''} />
    <span class="task-text ${task.completed ? 'text-decoration-line-through' : ''} flex-grow-1">${task.text}</span>
    <span class="badge bg-secondary ms-2">
      ${task.oneTime ? 'One-time' : (task.resetMode === 'interval' ? formatResetTime(task.resetValue) : (task.resetMode === 'time' && task.resetValue ? '@' + task.resetValue : ''))}
    </span>
    <button class="btn btn-danger btn-sm delete-btn ms-3">x</button>
  `;

  list.appendChild(li);
}

// Helper function to format ms to readable string
function formatResetTime(ms) {
  if (!ms) return '';
  if (ms % 86400000 === 0) return `[${ms / 86400000}d]`;
  if (ms % 3600000 === 0) return `[${ms / 3600000}hr]`;
  if (ms % 60000 === 0) return `[${ms / 60000}m]`;
  return `[${ms}ms]`;
}

// Function to save categories to localStorage
function saveCategories() {
  localStorage.setItem('categories', JSON.stringify(categories));
}

// Function to set a reset timeout for a task
function setTaskResetTimeout(catId, taskId) {
  const catIndex = categories.findIndex(c => c.id === catId);
  if (catIndex === -1) return;
  const taskIndex = categories[catIndex].tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return;
  const task = categories[catIndex].tasks[taskIndex];

  // Skip reset for one-time tasks
  if (task.oneTime) return;
  if (!task.completed || !task.completedAt) return;

  if (task.resetMode === 'interval') {
    const completedAt = new Date(task.completedAt).getTime();
    const now = Date.now();
    const timePassed = now - completedAt;
    const timeLeft = (task.resetValue || 86400000) - timePassed;

    if (timeLeft <= 0) {
      task.completed = false;
      task.completedAt = null;
      saveCategories();
      renderCategories();
    } else {
      setTimeout(() => {
        categories = JSON.parse(localStorage.getItem('categories')) || categories;
        const catIdx = categories.findIndex(c => c.id === catId);
        if (catIdx === -1) return;
        const tIdx = categories[catIdx].tasks.findIndex(t => t.id === taskId);
        if (tIdx === -1) return;

        categories[catIdx].tasks[tIdx].completed = false;
        categories[catIdx].tasks[tIdx].completedAt = null;
        saveCategories();
        renderCategories();
      }, timeLeft);
    }
  } else if (task.resetMode === 'time') {
    const [hh, mm] = (task.resetValue || '00:00').split(':').map(Number);
    const now = new Date();
    let next = new Date(now);
    next.setHours(hh, mm, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const msUntil = next - now;
    setTimeout(() => {
      categories = JSON.parse(localStorage.getItem('categories')) || categories;
      const catIdx = categories.findIndex(c => c.id === catId);
      if (catIdx === -1) return;
      const tIdx = categories[catIdx].tasks.findIndex(t => t.id === taskId);
      if (tIdx === -1) return;

      categories[catIdx].tasks[tIdx].completed = false;
      categories[catIdx].tasks[tIdx].completedAt = null;
      saveCategories();
      renderCategories();
    }, msUntil);
  }
}

// Initial setup for Day/Night mode
const themeBtn = document.getElementById('toggleThemeBtn');
function updateThemeBtnText() {
  themeBtn.textContent = document.body.classList.contains('night-mode') ? 'Day' : 'Night';
}
themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('night-mode');
  localStorage.setItem('theme', document.body.classList.contains('night-mode') ? 'night' : 'day');
  updateThemeBtnText();
});

// Check localStorage for theme preference
if (localStorage.getItem('theme') === 'night') {
  document.body.classList.add('night-mode');
}
updateThemeBtnText();