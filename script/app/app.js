


document.addEventListener('DOMContentLoaded', async function () {

  await Promise.all([
    loadComponent('sidebar-container', '../assets/components/sidebar.html'),
    loadComponent('header-container', '../assets/components/header.html')
  ]);


  renderIcons();


  initSidebar();
  

  initSidebarDropdowns();
  

  setActiveSidebarMenu();


  initRefreshButton();
});


function initSidebarDropdowns() {
  const dropdownTriggers = document.querySelectorAll('.has-submenu');
  
  dropdownTriggers.forEach(trigger => {
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      

      const parentLi = this.closest('.sidebar-sub-dropdown-parent') || this.closest('.sidebar-dropdown-parent');
      
      if (parentLi) {
        parentLi.classList.toggle('is-expanded');
      }
    });
  });
}


async function loadComponent(elementId, filepath) {
  try {
    const response = await fetch(filepath);
    if (!response.ok) throw new Error(`Gagal memuat ${filepath}`);
    const html = await response.text();
    document.getElementById(elementId).innerHTML = html;
  } catch (error) {
    console.error('Error loading component:', error);
  }
}


function initSidebar() {
  const sidebar = document.getElementById('main-sidebar');
  const container = document.getElementById('main-container');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const toggleOpenIcon = document.getElementById('toggle-icon-open');
  const toggleCollapsedIcon = document.getElementById('toggle-icon-collapsed');
  const brandLogo = document.getElementById('brand-logo');

  if (!sidebar || !container || !toggleBtn || !toggleOpenIcon || !toggleCollapsedIcon || !brandLogo) return;

  toggleBtn.addEventListener('click', function () {
    const isCollapsed = sidebar.classList.toggle('is-collapsed');
    container.classList.toggle('sidebar-content-collapsed', isCollapsed);
    toggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
    toggleOpenIcon.classList.toggle('sidebar-toggle-icon-hidden', isCollapsed);
    toggleCollapsedIcon.classList.toggle('sidebar-toggle-icon-hidden', !isCollapsed);
  });
}


function initRefreshButton() {
  const refreshBtn = document.getElementById('btn-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function () {
      refreshBtn.classList.add('animate-spin');
      setTimeout(() => {
        refreshBtn.classList.remove('animate-spin');
      }, 600);
    });
  }
}


function setActiveSidebarMenu() {
  const currentPath = window.location.pathname.split('/').pop();
  const navLinks = document.querySelectorAll('#main-sidebar .sidebar-nav-item');

  navLinks.forEach(link => {
    link.classList.remove('active');
    const linkPath = link.getAttribute('href') ? link.getAttribute('href').split('/').pop() : '';
    if (linkPath && linkPath === currentPath) {
      link.classList.add('active');
    }
  });
}


function initFlatpickr(selector, options = {}) {
  const elements = document.querySelectorAll(selector);
  if (!elements.length) return;

  const defaultOptions = {
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'j F Y',
    locale: 'id',
    ...options
  };

  if (typeof flatpickr !== 'undefined') {
    return flatpickr(elements, defaultOptions);
  } else {
    console.error('Pustaka Flatpickr belum dimuat.');
  }
}


function initTomSelect(selector, jsonFilePath, options = {}) {
  const element = document.querySelector(selector);
  if (!element) return;

  let allData = [];
  let isDataLoaded = false;

  const defaultOptions = {
    valueField: 'nama',
    labelField: 'nama',
    searchField: ['nama', 'type_merk'],
    maxOptions: 10,
    loadThrottle: 300,
    placeholder: 'Pilih atau cari nama barang / jasa...',
    plugins: ['dropdown_input'],
    persist: false,
    create: false,
    load: function(query, callback) {
      if (!isDataLoaded) {
        fetch(jsonFilePath)
          .then(response => response.json())
          .then(data => {
            allData = data;
            isDataLoaded = true;
            processSearch(query, callback);
          })
          .catch(() => callback());
      } else {
        processSearch(query, callback);
      }
    },
    ...options
  };

  function processSearch(query, callback) {
    if (!query.length) return callback();
    const results = allData.filter(item => {
      const matchNama = item.nama && item.nama.toLowerCase().includes(query.toLowerCase());
      const matchType = item.type_merk && item.type_merk.toLowerCase().includes(query.toLowerCase());
      return matchNama || matchType;
    });
    callback(results.slice(0, 10));
  }

  if (typeof TomSelect !== 'undefined') {
    return new TomSelect(element, defaultOptions);
  } else {
    console.error('Pustaka Tom Select belum dimuat.');
  }
}


document.addEventListener('click', function (e) {
  const wrapper = e.target.closest('.header-user-dropdown-wrapper');
  const menuBtn = e.target.closest('#user-menu-btn');
  const logoutBtn = e.target.closest('#menu-logout');
  const resetPassBtn = e.target.closest('#menu-reset-password');


  if (menuBtn) {
    const parentWrapper = menuBtn.closest('.header-user-dropdown-wrapper');
    if (parentWrapper) {
      parentWrapper.classList.toggle('active');
      const expanded = parentWrapper.classList.contains('active');
      menuBtn.setAttribute('aria-expanded', expanded);
    }
    return;
  }


  if (!wrapper) {
    document.querySelectorAll('.header-user-dropdown-wrapper.active').forEach(el => {
      el.classList.remove('active');
      const btn = el.querySelector('#user-menu-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }


  if (resetPassBtn) {
    e.preventDefault();
    alert('Fitur ganti/reset kata sandi akan segera dibuka.');
    document.querySelectorAll('.header-user-dropdown-wrapper.active').forEach(el => el.classList.remove('active'));
  }


  if (logoutBtn) {
    e.preventDefault();
    if (typeof handleLogout === 'function') {
      handleLogout();
    }
  }
});