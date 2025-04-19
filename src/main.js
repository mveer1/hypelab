// Theme toggle logic
const themeSwitch = document.getElementById('theme-switch');
themeSwitch.addEventListener('change', function() {
  if (this.checked) {
    document.body.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }
});

// On load, set theme from localStorage
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    document.getElementById('theme-switch').checked = true;
  }
  // Optional: On load, select category from URL if provided
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('category');
  if (cat) {
    document.querySelectorAll('#category-tabs li').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === cat);
    });
  }
});

// Category tab switching
document.querySelectorAll('#category-tabs li').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('#category-tabs li').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    // TODO: Load category-specific content if needed
  });
});

// Data tabs switching (Graphs/Values)
document.querySelectorAll('.data-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.data-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(this.dataset.tab + '-container').classList.add('active');
  });
});
