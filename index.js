// Get references to main DOM elements for categories and new category creation
const categoriesContainer = document.getElementById('categoriesContainer');
const newCategoryInput = document.getElementById('newCategoryInput');
const createCategoryBtn = document.getElementById('createCategoryBtn');

// Load categories from localStorage on page load and render them
let categories = JSON.parse(localStorage.getItem('categories')) || [];
renderCategories();

// Handle creation of a new category when the button is clicked
createCategoryBtn.addEventListener('click', () => {
  // Get and validate new category name
  const categoryName = newCategoryInput.value.trim();
  if (!categoryName) {
    alert('Please enter a category name!');
    return;
  }
  // Prevent duplicate category names (case-insensitive)
  if (categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
    alert('Category already exists!');
    return;
  }
  // Create and save new category object
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

// Render all categories and their tasks
function renderCategories() {
  // Clear the categories container
  categoriesContainer.innerHTML = '';

  // Loop through each category and build its section
  categories.forEach(category => {

    // Create the main section for this category
    const categorySection = document.createElement('div');
    categorySection.className = 'mb-5';
    categorySection.id = category.id;

    // Set up the HTML for the category header and task input form
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
          <select class="form-select task-reset-mode" style="max-width: 140px;">
            <option value="interval">Interval</option>
            <option value="time" selected>Time of Day</option>
          </select>
          <input type="number" class="form-control task-reset-amount" min="1" value="24" style="max-width: 80px;" placeholder="Time">
          <select class="form-select task-reset-unit" style="max-width: 100px;">
            <option value="minutes">min</option>
            <option value="hours" selected>hr</option>
            <option value="days">day</option>
          </select>
          <input type="time" class="form-control task-reset-time" style="max-width: 140px; display: none;">
          <input type="text" class="form-control task-input" placeholder="Enter a task">
          <button class="btn btn-primary add-task-btn">Add</button>
        </div>
        <ul class="list-group task-list"></ul>
      </div>
    `;

    // Add collapse/expand functionality for the category
    const collapseBtn = categorySection.querySelector('.collapse-category-btn');
    const categoryContent = categorySection.querySelector('.category-content');
    let collapsed = false;
    collapseBtn.addEventListener('click', () => {
      collapsed = !collapsed;
      categoryContent.style.display = collapsed ? 'none' : '';
      collapseBtn.textContent = collapsed ? '+' : '-';
    });

    // Add the category section to the main container
    categoriesContainer.appendChild(categorySection);

    // Get references to form elements for this category
    const input = categorySection.querySelector('.task-input');
    const addBtn = categorySection.querySelector('.add-task-btn');
    const resetMode = categorySection.querySelector('.task-reset-mode');
    const resetAmount = categorySection.querySelector('.task-reset-amount');
    const resetUnit = categorySection.querySelector('.task-reset-unit');
    const resetTime = categorySection.querySelector('.task-reset-time');
    const oneTimeCheckbox = categorySection.querySelector('.one-time-checkbox');
    const list = categorySection.querySelector('.task-list');
    const deleteCategoryBtn = categorySection.querySelector('.delete-category-btn');

    // Show/hide reset inputs based on the selected reset mode
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

    // Initialize reset mode visibility to match the default selection
    resetMode.dispatchEvent(new Event('change'));

    // Render all tasks for this category
    category.tasks.forEach(task => {
      addTaskToDOM(list, category.id, task);

      // If the task is completed, set up its reset timeout
      if (task.completed && task.completedAt) {
        setTaskResetTimeout(category.id, task.id);
      }
    });

    // Enable drag-and-drop sorting for tasks using SortableJS
    if (typeof Sortable !== 'undefined') {
      Sortable.create(list, {
        animation: 150,
        onEnd: function (evt) {
          const catIndex = categories.findIndex(c => c.id === category.id);
          if (catIndex === -1) return;
          const newOrder = Array.from(list.children).map(li => li.dataset.taskId);
          categories[catIndex].tasks = newOrder.map(id => category.tasks.find(t => t.id === id));
          saveCategories();
        }
      });
    }

    // Handle adding a new task to this category
    addBtn.addEventListener('click', () => {
      // Get and validate task input values
      const taskText = input.value.trim();
      const isOneTime = oneTimeCheckbox.checked;
      const mode = resetMode.value;
      let resetValue = null;

      // Calculate reset value based on mode
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

      // Prevent duplicate tasks in the same category
      if (category.tasks.some(t => t.text.toLowerCase() === taskText.toLowerCase())) {
        alert('Task already exists in this category!');
        return;
      }

      // Create and save the new task object
      const newTask = {
        id: `task-${Date.now()}`,
        text: taskText,
        completed: false,
        completedAt: null,
        resetMode: mode,
        resetValue: resetValue,
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

    // Handle deleting the entire category
    deleteCategoryBtn.addEventListener('click', () => {
      if (confirm(`Delete category "${category.name}"? This will delete all its tasks.`)) {
        categories = categories.filter(c => c.id !== category.id);
        saveCategories();
        renderCategories();
      }
    });

    // Handle task checkbox toggles and task deletion using event delegation
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

      // Handle checking/unchecking a task
      if (e.target.classList.contains('task-checkbox')) {
        if (e.target.checked) {
          task.completed = true;
          task.completedAt = new Date().toISOString();
          saveCategories();

          // Save completed task record separately for history
          let completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];
          completedTasks.push({
            task: task.text,
            completedAt: task.completedAt,
            category: category.name
          });
          localStorage.setItem('completedTasks', JSON.stringify(completedTasks));

          li.querySelector('.task-text').classList.add('text-decoration-line-through');
          setTaskResetTimeout(catId, taskId);
        } 
        else 
        {
          // Handle manual unchecking before timeout
          task.completed = false;
          task.completedAt = null;
          saveCategories();
          li.querySelector('.task-text').classList.remove('text-decoration-line-through');
        }
        saveCategories();
      }

      // Handle deleting a single task
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

// Add a single task to the DOM for a category
function addTaskToDOM(list, categoryId, task) {
  const li = document.createElement('li');
  li.className = 'list-group-item justify-content-between align-items-center';
  li.dataset.taskId = task.id;

  li.innerHTML = `
    <input type="checkbox" class="form-check-input me-2 task-checkbox" ${task.completed ? 'checked' : ''} />
    <span class="task-text ${task.completed ? 'text-decoration-line-through' : ''} flex-grow-1">${task.text}</span>
    <span class="badge bg-secondary ms-2">
      ${task.oneTime ? (task.resetMode === 'time' && task.resetValue ? 'One-time @' + task.resetValue : 'One-time') : (task.resetMode === 'interval' ? formatResetTime(task.resetValue) : (task.resetMode === 'time' && task.resetValue ? '@' + task.resetValue : ''))}
    </span>
    <button class="btn btn-danger btn-sm delete-btn ms-3">x</button>
  `;

  list.appendChild(li);
}

// Format a millisecond interval as a readable string (e.g., [2d], [3hr], [15m])
function formatResetTime(ms) {
  if (!ms) return '';
  if (ms % 86400000 === 0) return `[${ms / 86400000}d]`;
  if (ms % 3600000 === 0) return `[${ms / 3600000}hr]`;
  if (ms % 60000 === 0) return `[${ms / 60000}m]`;
  return `[${ms}ms]`;
}

// Save the categories array to localStorage
function saveCategories() {
  localStorage.setItem('categories', JSON.stringify(categories));
}

// Set a timeout to reset a completed task after its interval or at a specific time
function setTaskResetTimeout(catId, taskId) {
  const catIndex = categories.findIndex(c => c.id === catId);
  if (catIndex === -1) return;
  const taskIndex = categories[catIndex].tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return;
  const task = categories[catIndex].tasks[taskIndex];

  // Skip reset for incomplete tasks
  if (!task.completed || !task.completedAt) return;

  // Handle interval-based resets
  if (task.resetMode === 'interval') {
    // Skip reset for one-time interval tasks
    if (task.oneTime) return;
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
  } 
  // Handle time-of-day resets
  else if (task.resetMode === 'time') {
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

      // If it's a one-time task at a specific time, remove it after reset
      if (categories[catIdx].tasks[tIdx].oneTime) {
        categories[catIdx].tasks.splice(tIdx, 1);
      } else {
        categories[catIdx].tasks[tIdx].completed = false;
        categories[catIdx].tasks[tIdx].completedAt = null;
      }
      saveCategories();
      renderCategories();
    }, msUntil);
  }
}

// Handle day/night theme toggle button and persistence
const themeBtn = document.getElementById('toggleThemeBtn');
function updateThemeBtnText() {
  themeBtn.textContent = document.body.classList.contains('night-mode') ? 'Day' : 'Night';
}
themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('night-mode');
  localStorage.setItem('theme', document.body.classList.contains('night-mode') ? 'night' : 'day');
  updateThemeBtnText();
});

// On page load, set theme based on localStorage and update button text
if (localStorage.getItem('theme') === 'night') {
  document.body.classList.add('night-mode');
}
updateThemeBtnText();