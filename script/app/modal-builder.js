/**
 * GLOBAL COMPONENT: ModalBuilder
 * Mengelola pop-up modal secara dinamis di halaman manapun
 */
class ModalBuilder {
  constructor() {
    this.modalElement = null;
    this.initStructure();
  }


  initStructure() {
    if (document.getElementById('global-modal-wrapper')) return;

    const backdrop = document.createElement('div');
    backdrop.id = 'global-modal-wrapper';
    backdrop.className = 'global-modal-backdrop';

    backdrop.innerHTML = `
      <div class="global-modal-container" id="global-modal-box">
        <div class="global-modal-header">
          <h3 class="global-modal-title" id="global-modal-title">Judul Modal</h3>
          <button type="button" class="global-modal-close" id="global-modal-close-btn" aria-label="Tutup modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="global-modal-body" id="global-modal-content">
          
        </div>
        <div class="global-modal-footer" id="global-modal-footer" style="display: none;">
          
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    this.modalElement = backdrop;


    const closeBtn = backdrop.querySelector('#global-modal-close-btn');
    closeBtn.addEventListener('click', () => this.close());


    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        this.close();
      }
    });


    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  /**
   * Membuka modal dengan opsi yang disesuaikan dari halaman pemanggil
   * @param {Object} options - { title: '', content: string|HTMLElement, size: 'sm'|'md'|'lg'|'xl', footer: string|HTMLElement }
   */
  open(options = {}) {
    const titleEl = document.getElementById('global-modal-title');
    const contentEl = document.getElementById('global-modal-content');
    const footerEl = document.getElementById('global-modal-footer');
    const modalBox = document.getElementById('global-modal-box');


    titleEl.textContent = options.title || 'Informasi';


    contentEl.innerHTML = '';
    if (typeof options.content === 'string') {
      contentEl.innerHTML = options.content;
    } else if (options.content instanceof HTMLElement) {
      contentEl.appendChild(options.content);
    }


    modalBox.className = 'global-modal-container';
    if (options.size) {
      modalBox.classList.add(`modal-${options.size}`);
    }


    if (options.footer) {
      footerEl.style.display = 'flex';
      footerEl.innerHTML = '';
      if (typeof options.footer === 'string') {
        footerEl.innerHTML = options.footer;
      } else if (options.footer instanceof HTMLElement) {
        footerEl.appendChild(options.footer);
      }
    } else {
      footerEl.style.display = 'none';
    }


    this.modalElement.classList.add('is-active');
    document.body.style.overflow = 'hidden'; // Mencegah background scroll
  }


  close() {
    if (this.modalElement) {
      this.modalElement.classList.remove('is-active');
      document.body.style.overflow = '';
    }
  }

  isOpen() {
    return this.modalElement && this.modalElement.classList.contains('is-active');
  }
}


window.globalModal = new ModalBuilder();