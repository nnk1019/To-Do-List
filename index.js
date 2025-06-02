const categoriesContainer = document.getElementById('categoriesContainer');
const newCategoryInput = document.getElementById('newCategoryInput');
const createCategoryBtn = document.getElementById('createCategoryBtn');

// Load categories from localStorage on page load
let categories = JSON.parse(localStorage.getItem('categories')) || [];
renderCategories();

createCategoryBtn.addEventListener('click', () => {
  const categoryName = newCategoryInput.value.trim();
  if (!categoryName) {
    alert('Please enter a category name!');
    return;
  }

  // Check if category already exists (case insensitive)
  if (categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
    alert('Category already exists!');
    return;
  }

  // Create new category object with unique ID and empty tasks array
  const newCategory = {
    id: `cat-${Date.now()}`, // simple unique ID
    name: categoryName,
    tasks: []
  };
  categories.push(newCategory);
  saveCategories();
  renderCategories();

  newCategoryInput.value = '';
});

function renderCategories() {
  categoriesContainer.innerHTML = ''; // Clear existing

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
        <button class="btn btn-primary add-task-btn">Add</button>
      </div>
      <ul class="list-group task-list"></ul>
    `;

    categoriesContainer.appendChild(categorySection);

    const input = categorySection.querySelector('.task-input');
    const addBtn = categorySection.querySelector('.add-task-btn');
    const list = categorySection.querySelector('.task-list');
    const deleteCategoryBtn = categorySection.querySelector('.delete-category-btn');

    // Render tasks for this category
    category.tasks.forEach(task => {
      addTaskToDOM(list, category.id, task);
    });

    // Add new task handler
    addBtn.addEventListener('click', () => {
      const taskText = input.value.trim();
      if (!taskText) {
        alert('Please enter a task!');
        return;
      }

      const newTask = {
        id: `task-${Date.now()}`, // unique task ID
        text: taskText,
        completed: false,
        completedAt: null
      };

      // Update data & localStorage
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

      // Checkbox toggle
      if (e.target.classList.contains('task-checkbox')) {
        const task = categories[catIndex].tasks[taskIndex];
        if (e.target.checked) {
          task.completed = true;
          task.completedAt = new Date().toISOString();

          // Save completed task record separately
          let completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];
          completedTasks.push({
            task: task.text,
            completedAt: task.completedAt,
            category: category.name
          });
          localStorage.setItem('completedTasks', JSON.stringify(completedTasks));

          // Add strikethrough
          li.querySelector('.task-text').classList.add('completed');

          // Clear checkbox and strikethrough after 24 hours
          setTimeout(() => {
            // Reload categories in case user edited or deleted task meanwhile
            categories = JSON.parse(localStorage.getItem('categories')) || categories;
            const catIdx = categories.findIndex(c => c.id === catId);
            if (catIdx === -1) return;
            const tIdx = categories[catIdx].tasks.findIndex(t => t.id === taskId);
            if (tIdx === -1) return;

            categories[catIdx].tasks[tIdx].completed = false;
            categories[catIdx].tasks[tIdx].completedAt = null;
            saveCategories();

            // Update UI if task still exists in DOM
            const currentLi = categoriesContainer.querySelector(`#${catId} .task-list li[data-task-id="${taskId}"]`);
            if (currentLi) {
              currentLi.querySelector('.task-checkbox').checked = false;
              currentLi.querySelector('.task-text').classList.remove('completed');
            }
          }, 24 * 60 * 60 * 1000);

        } else {
          // Unchecked manually before timeout
          categories[catIndex].tasks[taskIndex].completed = false;
          categories[catIndex].tasks[taskIndex].completedAt = null;
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

function addTaskToDOM(list, categoryId, task) 
{
  const li = document.createElement('li');
  li.className = 'list-group-item justify-content-between align-items-center'; // Bootstrap flex classes
  li.dataset.taskId = task.id;

  li.innerHTML = `
    <input type="checkbox" class="form-check-input me-2 task-checkbox" ${task.completed ? 'checked' : ''} />
    <span class="task-text ${task.completed ? 'completed' : ''} flex-grow-1">${task.text}</span>
    <button class="btn btn-danger btn-sm delete-btn ms-3">x</button>
  `;

  list.appendChild(li);
}

function saveCategories() 
{
  localStorage.setItem('categories', JSON.stringify(categories));
}
