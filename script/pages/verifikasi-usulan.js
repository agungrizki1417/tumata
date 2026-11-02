/**
 * HALAMAN: Verifikasi Usulan Kebutuhan
 * Mengelola daftar usulan untuk diverifikasi, menampilkan modal komparasi jadwal,
 * pemilihan fase anggaran & kode rekening (menggunakan Selecton custom dropdown),
 * keputusan setuju/tolak, dan audit trail.
 */

document.addEventListener('DOMContentLoaded', function () {
  if (window.currentUserProfile && window.currentUserProfile.instansi_id) {
    initHalamanVerifikasi();
  } else {
    document.addEventListener('userProfileReady', () => {
      initHalamanVerifikasi();
    }, { once: true });
  }
});

const STATUS_VERIFIKASI_CONFIG = {
  pending: { bg: '#FEF3C7', text: '#B45309', label: 'Pending / Belum' },
  draf: { bg: '#F1F5F9', text: '#475569', label: 'Draf' },
  diajukan: { bg: '#E0F2FE', text: '#0369A1', label: 'Diajukan' },
  disetujui: { bg: '#DCFCE7', text: '#166534', label: 'Disetujui' },
  ditolak: { bg: '#FEE2E2', text: '#991B1B', label: 'Ditolak' }
};


let selectonFaseInstance = null;
let selectonRekeningInstance = null;


let rekeningState = {
  page: 0,
  limit: 10, // 10 data per halaman
  search: '',
  hasMore: true,
  isLoading: false,
  dataList: [],
  selectedId: null
};

/**
 * Inisialisasi komponen halaman, event listener filter, dan muat data tabel
 */
async function initHalamanVerifikasi() {
  await fetchDaftarUsulanVerifikasi();

  const searchInput = document.getElementById('filter-search');
  const statusSelect = document.getElementById('filter-status');
  const unitSelect = document.getElementById('filter-unit');

  if (searchInput) {
    searchInput.addEventListener('input', () => debounceFetch());
  }
  if (statusSelect) {
    statusSelect.addEventListener('change', () => fetchDaftarUsulanVerifikasi());
  }
  if (unitSelect) {
    unitSelect.addEventListener('change', () => fetchDaftarUsulanVerifikasi());
  }
}

let searchTimer = null;
function debounceFetch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    fetchDaftarUsulanVerifikasi();
  }, 300);
}

/**
 * Mengambil daftar usulan dari Supabase dengan filter pencarian, status, dan unit kerja
 */
async function fetchDaftarUsulanVerifikasi() {
  const containerId = '#tabel-verifikasi-usulan-container';
  const supabaseClient = window.supabaseClient;

  if (!supabaseClient) {
    console.error('Supabase client belum diinisialisasi.');
    return;
  }

  try {
    let query = supabaseClient
      .from('c_usulan_kebutuhan')
      .select(`
        id,
        nomor_usulan,
        tanggal_usulan,
        harga_satuan,
        status,
        b_master_barang (
          nama_barang,
          satuan
        ),
        a_ruang_tujuan (
          id,
          nama_ruang
        ),
        a_pengguna!c_usulan_kebutuhan_pengusul_id_fkey (
          nama_lengkap
        ),
        c_jadwal_kebutuhan (
          jumlah
        )
      `)
      .order('created_at', { ascending: false });

    const searchVal = document.getElementById('filter-search')?.value?.trim();
    const statusVal = document.getElementById('filter-status')?.value;
    const unitVal = document.getElementById('filter-unit')?.value;

    if (statusVal) {
      query = query.eq('status', statusVal);
    }
    if (unitVal) {
      query = query.eq('ruang_tujuan_id', unitVal);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Gagal memuat daftar usulan untuk verifikasi:', error.message);
      renderTableVerifikasi(containerId, []);
      return;
    }

    let filteredData = data || [];
    if (searchVal) {
      const q = searchVal.toLowerCase();
      filteredData = filteredData.filter(item => {
        const noUsulan = (item.nomor_usulan || '').toLowerCase();
        const namaBarang = (item.b_master_barang?.nama_barang || '').toLowerCase();
        const pengusul = (item.a_pengguna?.nama_lengkap || '').toLowerCase();
        return noUsulan.includes(q) || namaBarang.includes(q) || pengusul.includes(q);
      });
    }

    const formattedData = filteredData.map((item, index) => {
      const totalVolume = (item.c_jadwal_kebutuhan || []).reduce((acc, curr) => acc + Number(curr.jumlah || 0), 0);

      return {
        id: item.id,
        no_urut: index + 1,
        nama_pengusul: item.a_pengguna?.nama_lengkap || '-',
        nama_barang: item.b_master_barang?.nama_barang || 'Barang tidak ditemukan',
        volume: `${totalVolume} ${item.b_master_barang?.satuan || ''}`.trim(),
        status: item.status || 'pending'
      };
    });

    renderTableVerifikasi(containerId, formattedData);

  } catch (err) {
    console.error('Terjadi kesalahan tak terduga saat mengambil data verifikasi:', err);
    renderTableVerifikasi(containerId, []);
  }
}

/**
 * Merender tabel menggunakan komponen global TableBuilder dengan gaya persis tabel usulan
 */
function renderTableVerifikasi(containerId, dataList) {
  new TableBuilder(containerId, {
    columns: [
      {
        key: 'no_urut',
        label: 'No.',
        width: '20px',
        headerAlign: 'center',
        align: 'center',
        render: (val) => `<span class="td-main">${val}</span>`
      },
      {
        key: 'nama_barang',
        label: 'Nama Barang / Jasa',
        headerAlign: 'center',
        align: 'left',
        render: (val) => `<span class="td-main">${val}</span>`
      },
      {
        key: 'volume',
        label: 'Volume',
        width: '130px',
        headerAlign: 'center',
        align: 'center',
        render: (val) => `<span class="td-main">${val}</span>`
      },
      {
        key: 'status',
        label: 'Status Usulan',
        width: '140px',
        headerAlign: 'center',
        align: 'center',
        render: (val) => {
          const key = (val || '').toLowerCase();
          const config = STATUS_VERIFIKASI_CONFIG[key] || STATUS_VERIFIKASI_CONFIG['pending'];
          return `
            <span class="badge-custom" style="--status-bg: ${config.bg}; --status-color: ${config.text};">
              ${config.label}
            </span>
          `;
        }
      },
      {
        key: 'id',
        label: 'Aksi',
        width: '100px',
        headerAlign: 'center',
        align: 'center',
        render: (val) => `
          <button type="button" class="btn-secondary-sm" onclick="renderVerifikasiModal('${val}')">
            Verifikasi
          </button>
        `
      }
    ],
    data: dataList,
    emptyText: 'Tidak ada usulan yang perlu diverifikasi.'
  });

  if (typeof window.initIcons === 'function') {
    window.initIcons();
  } else if (typeof window.renderIcons === 'function') {
    window.renderIcons();
  }
}

/**
 * Membuka globalModal untuk menampilkan detail usulan, komparasi jadwal bulanan,
 * pilihan fase anggaran, pilihan kode rekening (Selecton), keputusan, dan catatan.
 */
async function renderVerifikasiModal(usulanId) {
  const supabaseClient = window.supabaseClient;
  if (!supabaseClient || !window.globalModal) return;

  window.globalModal.open({
    title: 'Memuat Form Verifikasi...',
    size: 'lg',
    content: '<div style="text-align: center; padding: 2rem;">Mengambil data usulan dan data master...</div>'
  });

  try {

    const [
      { data: usulanData, error: usulanError },
      { data: faseData, error: faseError }
    ] = await Promise.all([
      supabaseClient
        .from('c_usulan_kebutuhan')
        .select(`
          id,
          nomor_usulan,
          tanggal_usulan,
          status,
          catatan_pengusul,
          link_referensi,
          harga_satuan,
          fase_anggaran_id,
          kode_rekening_id,
          b_master_barang (
            nama_barang,
            tipe_merk,
            satuan
          ),
          a_ruang_tujuan (
            nama_ruang
          ),
          a_pengguna!c_usulan_kebutuhan_pengusul_id_fkey (
            nama_lengkap
          ),
          c_jadwal_kebutuhan (
            bulan,
            jumlah
          )
        `)
        .eq('id', usulanId)
        .single(),

      supabaseClient
        .from('a_fase_anggaran')
        .select('id, nama_fase')
        .eq('is_active', true)
        .order('id', { ascending: true })
    ]);

    if (usulanError || !usulanData) {
      console.error('Gagal memuat detail usulan:', usulanError?.message);
      window.globalModal.open({
        title: 'Kesalahan',
        size: 'sm',
        content: '<p>Gagal memuat data detail usulan.</p>'
      });
      return;
    }


    const rincianAsliMap = {};
    (usulanData.c_jadwal_kebutuhan || []).forEach(item => {
      rincianAsliMap[item.bulan] = Number(item.jumlah) || 0;
    });


    const jadwalVerifMap = {};
    (usulanData.c_jadwal_kebutuhan || []).forEach(item => {
      jadwalVerifMap[item.bulan] = Number(item.jumlah) || 0;
    });

    const namaBulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    let rowsKomparasiHtml = '';
    namaBulan.forEach((namaBln, index) => {
      const bulanKe = index + 1;
      const valAsli = rincianAsliMap[bulanKe] || 0;
      const valVerif = jadwalVerifMap[bulanKe] !== undefined ? jadwalVerifMap[bulanKe] : valAsli;

      rowsKomparasiHtml += `
        <tr>
          <td style="padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--color-border);">${namaBln}</td>
          <td style="padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--color-border); text-align: center;">${valAsli}</td>
          <td style="padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--color-border); text-align: center;">
            <input type="number" class="form-input input-jadwal-verif" data-bulan="${bulanKe}" value="${valVerif}" min="0" style="width: 80px; padding: 0.25rem 0.5rem; text-align: center; margin: 0 auto;">
          </td>
        </tr>
      `;
    });


    const modalContentHtml = `
      <form id="form-verifikasi" style="display: flex; flex-direction: column; gap: 1.25rem;">
        
        
        <div style="background: var(--color-bg-subtle, #F8FAFC); border: 1px solid var(--color-border); border-radius: 6px; padding: 1rem;">
          <h4 style="margin-bottom: 0.75rem;">Detail Usulan & Spesifikasi</h4>
          <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem;">
            <div>
              <span>No. Usulan</span>
              <div>${usulanData.nomor_usulan || '-'}</div>
            </div>
            <div>
              <span>Pengusul</span>
              <div>${usulanData.a_pengguna?.nama_lengkap || '-'}</div>
            </div>
            <div>
              <span>Unit Tujuan</span>
              <div>${usulanData.a_ruang_tujuan?.nama_ruang || '-'}</div>
            </div>
            <div>
              <span>Nama Barang & Spesifikasi</span>
              <div>${usulanData.b_master_barang?.nama_barang || '-'} (${usulanData.b_master_barang?.tipe_merk || '-'})</div>
            </div>
            <div>
              <span>Harga Satuan</span>
              <div>Rp ${Number(usulanData.harga_satuan || 0).toLocaleString('id-ID')}</div>
            </div>
          </div>
          ${usulanData.catatan_pengusul ? `
            <div style="margin-top: 0.75rem;">
              <span>Catatan Pengusul</span>
              <div style="margin: 0; background: #FFF; padding: 0.375rem 0.5rem; border: 1px solid var(--color-border); border-radius: 4px;">${usulanData.catatan_pengusul}</div>
            </div>
          ` : ''}
          ${usulanData.link_referensi ? `
            <div style="margin-top: 0.5rem;">
              <span>Link Referensi</span>
              <div><a href="${usulanData.link_referensi}" target="_blank">Link Referensi</a></div>
            </div>
          ` : ''}
        </div>

        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label" style="margin-bottom: 0.375rem; display: block;">Fase Anggaran <span style="color: var(--color-rose);">*</span></label>
            <div id="selecton-fase-container"></div>
          </div>
          <div class="form-group">
            <label class="form-label" style="margin-bottom: 0.375rem; display: block;">Kode Rekening <span style="color: var(--color-rose);">*</span></label>
            <div id="selecton-rekening-container"></div>
          </div>
        </div>

        
        <div class="form-group">
          <label class="form-label" style="margin-bottom: 0.375rem; display: block;">Keputusan Verifikasi</label>
          <div style="display: flex; gap: 1.5rem; align-items: center;">
            <label style="display: flex; align-items: center; gap: 0.375rem; cursor: pointer;">
              <input type="radio" name="verif-keputusan" value="disetujui" checked> Setuju
            </label>
            <label style="display: flex; align-items: center; gap: 0.375rem; cursor: pointer;">
              <input type="radio" name="verif-keputusan" value="ditolak"> Tolak
            </label>
          </div>
        </div>

        
        <div>
          <h4 style="margin-bottom: 0.5rem;">Periode Kebutuhan</h4>
          <div style="border: 1px solid var(--color-border); border-radius: 6px; overflow: hidden; background: #FFFFFF; max-height: 180px; overflow-y: auto;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: var(--color-bg-subtle); border-bottom: 1px solid var(--color-border); text-align: left;">
                  <th style="padding: 0.5rem 0.75rem;">Bulan</th>
                  <th style="padding: 0.5rem 0.75rem; text-align: center;">Periode Kebutuhan</th>
                  <th style="padding: 0.5rem 0.75rem; text-align: center;">Verifikasi Periode Kebutuhan</th>
                </tr>
              </thead>
              <tbody>
                ${rowsKomparasiHtml}
              </tbody>
            </table>
          </div>
        </div>

        
        <div class="form-group">
          <label for="verif-catatan" class="form-label" style="margin-bottom: 0.375rem; display: block;">
            Catatan Verifikator <span id="label-wajib-catatan" style="display: none;">(Wajib jika ditolak)</span>
          </label>
          <textarea id="verif-catatan" class="form-textarea" rows="2" placeholder="Berikan catatan atau alasan verifikasi di sini..." style="width: 100%; padding: 0.5rem; border: 1px solid var(--color-border); border-radius: 6px; font-family: var(--font-sans);"></textarea>
        </div>

      </form>
    `;

    const modalFooterHtml = `
      <button type="button" class="btn-secondary-sm" onclick="window.globalModal.close()">Batal</button>
      <button type="button" class="btn-page active" onclick="submitVerifikasi('${usulanId}')">Simpan Keputusan</button>
    `;

    window.globalModal.open({
      title: `Verifikasi Usulan`,
      size: 'lg',
      content: modalContentHtml,
      footer: modalFooterHtml
    });


    const formattedFaseData = (faseData || []).map(f => ({
      value: f.id,
      label: f.nama_fase
    }));

    selectonFaseInstance = new Selecton('#selecton-fase-container', {
      placeholder: '-- Pilih Fase Anggaran --',
      searchPlaceholder: 'Cari fase...',
      data: formattedFaseData
    });

    if (usulanData.fase_anggaran_id) {
      selectonFaseInstance.setValue(usulanData.fase_anggaran_id);
    }


    rekeningState = {
      page: 0,
      limit: 10,
      search: '',
      hasMore: true,
      isLoading: false,
      dataList: [],
      selectedId: usulanData.kode_rekening_id || null
    };

    let debounceTimerRekening = null;

    selectonRekeningInstance = new Selecton('#selecton-rekening-container', {
      placeholder: '-- Pilih Kode Rekening --',
      searchPlaceholder: 'Ketik kode / nama rekening...',
      data: [],


      onSearch: (query, instance) => {
        clearTimeout(debounceTimerRekening);
        debounceTimerRekening = setTimeout(() => {
          rekeningState.search = query;
          rekeningState.page = 0;
          rekeningState.hasMore = true;
          rekeningState.dataList = [];
          fetchKodeRekeningLazy(instance, false);
        }, 300);
      },


      onScrollEnd: (instance) => {
        if (rekeningState.hasMore && !rekeningState.isLoading) {
          rekeningState.page += 1;
          fetchKodeRekeningLazy(instance, true);
        }
      },


      onSelect: (selectedObj) => {
        rekeningState.selectedId = selectedObj.value;
      }
    });


    await fetchKodeRekeningLazy(selectonRekeningInstance, false);


    if (usulanData.kode_rekening_id) {
      const isAlreadyInList = rekeningState.dataList.some(item => item.value === usulanData.kode_rekening_id);
      if (!isAlreadyInList) {
        const { data: rekDetail } = await supabaseClient
          .from('b_kode_rekening')
          .select('id, kode_rekening, nama_rekening')
          .eq('id', usulanData.kode_rekening_id)
          .single();

        if (rekDetail) {
          const formattedItem = {
            value: rekDetail.id,
            label: `${rekDetail.kode_rekening} - ${rekDetail.nama_rekening}`
          };
          rekeningState.dataList.unshift(formattedItem);
          selectonRekeningInstance.setData(rekeningState.dataList);
        }
      }
      selectonRekeningInstance.setValue(usulanData.kode_rekening_id);
    }


    const radioInputs = document.querySelectorAll('input[name="verif-keputusan"]');
    radioInputs.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const labelWajib = document.getElementById('label-wajib-catatan');
        if (e.target.value === 'ditolak') {
          if (labelWajib) labelWajib.style.display = 'inline';
        } else {
          if (labelWajib) labelWajib.style.display = 'none';
        }
      });
    });

  } catch (err) {
    console.error('Terjadi kesalahan saat membuka form verifikasi:', err);
    window.globalModal.open({
      title: 'Kesalahan Sistem',
      size: 'sm',
      content: '<p>Terjadi kesalahan saat memuat data verifikasi.</p>'
    });
  }
}

/**
 * Fetch data kode rekening secara bertahap (Lazy Loading 10 items) dari Supabase
 */
async function fetchKodeRekeningLazy(selectonInstance, isAppend = false) {
  const supabaseClient = window.supabaseClient;
  if (!supabaseClient || rekeningState.isLoading) return;

  rekeningState.isLoading = true;
  if (!isAppend) {
    selectonInstance.setLoading(true);
  }

  try {
    const fromIndex = rekeningState.page * rekeningState.limit;
    const toIndex = fromIndex + rekeningState.limit - 1;

    let query = supabaseClient
      .from('b_kode_rekening')
      .select('id, kode_rekening, nama_rekening')
      .eq('aktif', true)
      .order('kode_rekening', { ascending: true })
      .range(fromIndex, toIndex);

    if (rekeningState.search) {
      const q = `%${rekeningState.search}%`;
      query = query.or(`kode_rekening.ilike.${q},nama_rekening.ilike.${q}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Gagal memuat lazy kode rekening:', error.message);
      return;
    }

    const newItems = (data || []).map(r => ({
      value: r.id,
      label: `${r.kode_rekening} - ${r.nama_rekening}`
    }));

    if (newItems.length < rekeningState.limit) {
      rekeningState.hasMore = false;
    }

    if (isAppend) {
      rekeningState.dataList = [...rekeningState.dataList, ...newItems];
    } else {
      rekeningState.dataList = newItems;
    }

    selectonInstance.setData(rekeningState.dataList);

  } catch (err) {
    console.error('Terjadi kesalahan saat fetch kode rekening:', err);
  } finally {
    rekeningState.isLoading = false;
  }
}

/**
 * Menyimpan keputusan verifikasi
 */
async function submitVerifikasi(usulanId) {
  const supabaseClient = window.supabaseClient;

  if (!supabaseClient) {
    alert('Supabase client belum diinisialisasi.');
    return;
  }


  const faseAnggaranId = selectonFaseInstance?.selectedData?.value || null;
  const kodeRekeningId = selectonRekeningInstance?.selectedData?.value || null;

  const keputusanRadio = document.querySelector('input[name="verif-keputusan"]:checked');
  const keputusan = keputusanRadio ? keputusanRadio.value : 'disetujui';
  const alasan = document.getElementById('verif-catatan')?.value?.trim() || '';


  if (keputusan === 'disetujui') {
    if (!faseAnggaranId) {
      alert('Silakan pilih fase anggaran terlebih dahulu!');
      return;
    }

    if (!kodeRekeningId) {
      alert('Silakan pilih kode rekening terlebih dahulu!');
      return;
    }
  }

  if ((keputusan === 'ditolak' || keputusan === 'perlu_perbaikan') && !alasan) {
    alert('Catatan/alasan verifikator wajib diisi jika usulan ditolak atau perlu perbaikan!');
    document.getElementById('verif-catatan')?.focus();
    return;
  }


  let jadwal = [];
  if (keputusan === 'disetujui') {
    const inputJadwalEls = document.querySelectorAll('.input-jadwal-verif');
    inputJadwalEls.forEach(el => {
      const bulan = parseInt(el.dataset.bulan);
      const jumlah = parseFloat(el.value) || 0;
      if (jumlah > 0) {
        jadwal.push({
          bulan: bulan,
          jumlah: jumlah
        });
      }
    });

    if (jadwal.length === 0) {
      alert('Mohon isi kuantitas jadwal bulanan yang disetujui minimal satu bulan!');
      return;
    }
  }

  if (!confirm('Apakah Anda yakin ingin menyimpan keputusan verifikasi ini?')) {
    return;
  }

  try {

    const { data, error } = await supabaseClient.rpc(
      'verifikasi_usulan_kebutuhan',
      {
        p_usulan_id: usulanId,
        p_keputusan: keputusan,
        p_alasan: alasan,
        p_kode_rekening_id: kodeRekeningId,
        p_fase_anggaran_id: faseAnggaranId,
        p_jadwal: jadwal
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.success !== true) {
      throw new Error(data?.message || 'Verifikasi gagal atau respons RPC tidak valid.');
    }

    alert('Keputusan verifikasi berhasil disimpan!');
    window.globalModal.close();


    fetchDaftarUsulanVerifikasi();

  } catch (err) {
    console.error('Terjadi kesalahan saat menyimpan verifikasi:', err);
    alert('Terjadi kesalahan: ' + err.message);
  }
}

document.addEventListener('DOMContentLoaded', function () {

  if (window.currentUserProfile) {
    validasiAksesPerencana();
  } else {
    document.addEventListener('userProfileReady', () => {
      validasiAksesPerencana();
    }, { once: true });
  }
});

async function validasiAksesPerencana() {
  try {
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
      window.location.href = '../dashboard.html';
      return;
    }


    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      alert('Sesi Anda telah berakhir. Silakan login kembali.');
      window.location.href = '../index.html';
      return;
    }


    const { data: relasiData, error: relasiError } = await supabaseClient
      .from('a_pengguna_memiliki_peran')
      .select('peran_id')
      .eq('pengguna_id', user.id);

    if (relasiError || !relasiData || relasiData.length === 0) {
      alert('Akses ditolak! Halaman ini khusus untuk Tim Perencana.');
      window.location.href = '../dashboard.html';
      return;
    }


    const peranIds = relasiData.map(item => item.peran_id);
    const { data: peranData, error: peranError } = await supabaseClient
      .from('a_peran')
      .select('*')
      .in('id', peranIds);

    if (peranError || !peranData) {
      alert('Gagal memverifikasi hak akses peran.');
      window.location.href = '../dashboard.html';
      return;
    }


    let isPerencana = peranData.some(peran => {
      const combinedText = Object.values(peran).join(' ').toLowerCase();
      return combinedText.includes('perencana');
    });

    if (!isPerencana) {
      alert('Akses ditolak! Halaman ini khusus untuk Tim Perencana.');
      window.location.href = '../dashboard.html';
      return;
    }


    if (typeof initHalamanVerifikasi === 'function') {
      initHalamanVerifikasi();
    }

  } catch (err) {
    console.error('Terjadi kesalahan saat validasi akses:', err);
    window.location.href = '../dashboard.html';
  }
}