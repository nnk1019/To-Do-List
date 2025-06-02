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
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h3 class="mb-0 flex-grow-1">${category.name}</h3>
        <button class="btn btn-danger btn-sm delete-category-btn ms-3">Delete Category</button>
      </div>
      <div class="input-group mb-2">
        <input type="text" class="form-control task-input" placeholder="Enter a task">
        <select class="form-select task-reset-select" style="max-width: 120px;">
          <option value="60000">1 min</option>
          <option value="3600000">1 hr</option>
          <option value="21600000">6 hr</option>
          <option value="43200000">12 hr</option>
          <option value="86400000" selected>24 hr</option>
          <option value="172800000">48 hr</option>
        </select>
        <button class="btn btn-primary add-task-btn">Add</button>
      </div>
      <ul class="list-group task-list"></ul>
    `;

    categoriesContainer.appendChild(categorySection);

    const input = categorySection.querySelector('.task-input');
    const addBtn = categorySection.querySelector('.add-task-btn');
    const resetSelect = categorySection.querySelector('.task-reset-select');
    const list = categorySection.querySelector('.task-list');
    const deleteCategoryBtn = categorySection.querySelector('.delete-category-btn');

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
      const taskResetTime = parseInt(resetSelect.value);
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
        resetTime: taskResetTime
      };
      const catIndex = categories.findIndex(c => c.id === category.id);
      if (catIndex > -1) {
        categories[catIndex].tasks.push(newTask);
        saveCategories();
        addTaskToDOM(list, category.id, newTask);
        input.value = '';
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

          li.querySelector('.task-text').classList.add('completed');
          setTaskResetTimeout(catId, taskId);
        } else {
          // Unchecked manually before timeout
          task.completed = false;
          task.completedAt = null;
          saveCategories();
          li.querySelector('.task-text').classList.remove('completed');
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
  <span class="task-text ${task.completed ? 'completed' : ''} flex-grow-1">${task.text}</span>
  <span class="badge bg-secondary ms-2">${formatResetTime(task.resetTime)}</span>
  <button class="btn btn-danger btn-sm delete-btn ms-3">x</button>
`;

// Helper function to format ms to readable string
function formatResetTime(ms) {
  if (ms === 60000) return '[1m]';
  if (ms === 3600000) return '[1hr]';
  if (ms === 21600000) return '[6hr]';
  if (ms === 43200000) return '[12hr]';
  if (ms === 86400000) return '[24hr]';
  if (ms === 172800000) return '[48hr]';
  return `${Math.round(ms / 60000)} min`;
}

  list.appendChild(li);
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

  if (!task.completed || !task.completedAt) return;

  const completedAt = new Date(task.completedAt).getTime();
  const now = Date.now();
  const timePassed = now - completedAt;
  const timeLeft = (task.resetTime || 86400000) - timePassed;

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