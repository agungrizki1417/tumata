/**
 * GLOBAL COMPONENT: TableBuilder
 * Membangun tabel secara fleksibel dan bersih di halaman manapun
 */
class TableBuilder {
  /**
   * @param {string|HTMLElement} container - Selector atau elemen kontainer penampung
   * @param {Object} options - { columns: [], data: [], emptyText: '', withPagination: true }
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) return;

    this.columns = options.columns || []; // [{ key: 'id', label: 'ID', align: 'left', render: fn }]
    this.data = options.data || [];
    this.emptyText = options.emptyText || 'Tidak ada data untuk ditampilkan';
    this.withPagination = options.withPagination !== undefined ? options.withPagination : true;

    this.init();
  }

  init() {
    this.container.innerHTML = '';


    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'table-container';


    const table = document.createElement('table');
    table.className = 'app-table';


    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');

    this.columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col.label;


      const hAlign = col.headerAlign || col.align;
      if (hAlign) th.className = `text-${hAlign}`;

      if (col.width) th.style.width = col.width;
      trHead.appendChild(th);
    });

    thead.appendChild(trHead);
    table.appendChild(thead);


    const tbody = document.createElement('tbody');

    if (this.data.length === 0) {
      const trEmpty = document.createElement('tr');
      const tdEmpty = document.createElement('td');
      tdEmpty.colSpan = this.columns.length;
      tdEmpty.className = 'text-center';
      tdEmpty.style.padding = '2rem';
      tdEmpty.style.color = 'var(--color-text-muted)';
      tdEmpty.textContent = this.emptyText;
      trEmpty.appendChild(tdEmpty);
      tbody.appendChild(trEmpty);
    } else {
      this.data.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');

        this.columns.forEach(col => {
          const td = document.createElement('td');
          if (col.align) td.className = `text-${col.align}`;


          if (typeof col.render === 'function') {
            td.innerHTML = col.render(row[col.key], row, rowIndex);
          } else {
            td.textContent = row[col.key] !== undefined ? row[col.key] : '-';
          }

          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });
    }

    table.appendChild(tbody);
    tableWrapper.appendChild(table);


    if (this.withPagination && this.data.length > 0) {
      const footer = document.createElement('div');
      footer.className = 'table-footer';

      footer.innerHTML = `
        
        <div class="table-footer-left">
          <span>Tampilkan</span>
          <select class="table-per-page-select" id="table-limit-select">
            <option value="10" selected>10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span>data</span>
          <span style="color: var(--color-border); margin: 0 0.25rem;">•</span>
          <span class="table-info">Menampilkan 1 - ${this.data.length} dari ${this.data.length} data</span>
        </div>

        
        <div class="table-footer-right">
          <div class="table-pagination">
            <button type="button" class="btn-page" disabled>‹</button>
            <button type="button" class="btn-page active">1</button>
            <button type="button" class="btn-page" disabled>›</button>
          </div>
        </div>
      `;

      tableWrapper.appendChild(footer);
    }

    this.container.appendChild(tableWrapper);

    if (typeof window.initIcons === 'function') {
      window.initIcons();
    } else if (typeof window.renderIcons === 'function') {
      window.renderIcons();
    }
  }


  setData(newData) {
    this.data = newData;
    this.init();
  }
}