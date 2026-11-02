/**
 * SELECTON - Custom Searchbar Dropdown Library
 * Component Global Tanpa Dependensi
 */
class Selecton {
  constructor(element, options = {}) {

    this.wrapper = typeof element === 'string' ? document.querySelector(element) : element;
    if (!this.wrapper) return;


    this.options = {
      placeholder: options.placeholder || 'Pilih data...',
      searchPlaceholder: options.searchPlaceholder || 'Cari data...',
      emptyText: options.emptyText || 'Data tidak ditemukan',
      loadingText: options.loadingText || 'Memuat data...',
      data: options.data || [], // Array lokal awal jika ada
      

      onSearch: options.onSearch || null,      // Hook untuk Custom Filter / Debounce / Fuzzy
      onScrollEnd: options.onScrollEnd || null, // Hook untuk Lazy Loading / Infinite Scroll
      onSelect: options.onSelect || null,      // Callback saat item dipilih
    };

    this.isOpen = false;
    this.selectedData = null;
    this.filteredData = [];

    this.initHTML();
    this.bindEvents();
    

    if (this.options.data.length > 0) {
      this.setData(this.options.data);
    }
  }


  initHTML() {
    this.wrapper.classList.add('selecton-wrapper');
    this.wrapper.innerHTML = `
      <input type="text" class="selecton-display" placeholder="${this.options.placeholder}" readonly>
      <svg class="selecton-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
      <div class="selecton-dropdown">
        <div class="selecton-search-box">
          <input type="text" class="selecton-search-input" placeholder="${this.options.searchPlaceholder}">
        </div>
        <ul class="selecton-results"></ul>
      </div>
    `;

    this.displayInput = this.wrapper.querySelector('.selecton-display');
    this.dropdown = this.wrapper.querySelector('.selecton-dropdown');
    this.searchInput = this.wrapper.querySelector('.selecton-search-input');
    this.resultsList = this.wrapper.querySelector('.selecton-results');
  }


  bindEvents() {

    this.displayInput.addEventListener('click', () => this.toggle());


    this.searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      if (typeof this.options.onSearch === 'function') {

        this.options.onSearch(query, this);
      } else {

        this.filterDefault(query);
      }
    });


    this.resultsList.addEventListener('scroll', () => {
      if (typeof this.options.onScrollEnd === 'function') {
        const { scrollTop, scrollHeight, clientHeight } = this.resultsList;
        if (scrollTop + clientHeight >= scrollHeight - 5) {
          this.options.onScrollEnd(this);
        }
      }
    });


    document.addEventListener('click', (e) => {
      if (!this.wrapper.contains(e.target) && this.isOpen) {
        this.close();
      }
    });


    this.wrapper.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    this.wrapper.classList.add('is-open');
    this.searchInput.value = '';
    

    if (!this.options.onSearch) {
      this.filterDefault('');
    }
    
    setTimeout(() => this.searchInput.focus(), 50);
  }

  close() {
    this.isOpen = false;
    this.wrapper.classList.remove('is-open');
  }


  setData(dataArray) {
    this.options.data = dataArray;
    this.filterDefault('');
  }


  setValue(val) {
    if (!val) return;
    const found = this.options.data.find(item => {
      const itemVal = typeof item === 'object' ? item.value : item;
      return String(itemVal) === String(val);
    });

    if (found) {
      const valObj = typeof found === 'object' ? found : { value: found, label: found };
      this.selectedData = valObj;
      this.displayInput.value = valObj.label;
    }
  }


  filterDefault(query) {
    const q = query.toLowerCase().trim();
    this.filteredData = this.options.data.filter(item => {
      const label = typeof item === 'object' ? item.label : item;
      return label.toLowerCase().includes(q);
    });
    this.renderResults(this.filteredData);
  }


  renderResults(items) {
    this.resultsList.innerHTML = '';

    if (!items || items.length === 0) {
      this.resultsList.innerHTML = `<li class="selecton-empty">${this.options.emptyText}</li>`;
      return;
    }

    items.forEach(item => {
      const val = typeof item === 'object' ? item.value : item;
      const label = typeof item === 'object' ? item.label : item;

      const li = document.createElement('li');
      li.className = 'selecton-item';
      if (this.selectedData && this.selectedData.value === val) {
        li.classList.add('is-selected');
      }
      li.textContent = label;

      li.addEventListener('click', () => {
        this.select({ value: val, label: label });
      });

      this.resultsList.appendChild(li);
    });
  }


  select(dataObj) {
    this.selectedData = dataObj;
    this.displayInput.value = dataObj.label;
    this.close();


    if (typeof this.options.onSelect === 'function') {
      this.options.onSelect(dataObj);
    }
  }


  setLoading(isLoading) {
    if (isLoading) {
      this.resultsList.innerHTML = `<li class="selecton-loading">${this.options.loadingText}</li>`;
    }
  }
}