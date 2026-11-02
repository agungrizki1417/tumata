document.addEventListener('DOMContentLoaded', function () {
  initTanggalPengajuan();
  initNomorDokumenPreview();
  initKlasterSelecton();
  initBarangJasaSelecton();
  initUnitSasaranSelecton();
  restoreSavedFormState();
  initPeriodeKebutuhanRestriction();


  if (window.currentUserProfile && window.currentUserProfile.instansi_id) {
    initNomorDokumenPreview();
  } else {
    document.addEventListener('userProfileReady', () => {
      initNomorDokumenPreview();
    }, { once: true });
  }

  const btnBersihkan = document.getElementById('btn-bersihkan');
  if (btnBersihkan) {
    btnBersihkan.addEventListener('click', resetFormTotal);
  }
});

function initTanggalPengajuan() {
  const input = document.getElementById('tanggal-pengajuan');
  if (!input) return;


  input.type = 'text';
  input.readOnly = true;
  input.classList.add('readonly-input');


  const today = new Date();
  const year = today.getFullYear();
  const monthIndex = today.getMonth();
  const day = String(today.getDate()).padStart(2, '0');

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];


  const formattedDisplay = `${day} ${monthNames[monthIndex]} ${year}`;


  const rawIsoDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${day}`;

  input.value = formattedDisplay;
  input.dataset.rawDate = rawIsoDate;
}




async function initKlasterSelecton() {
  const containerId = '#klaster-container';
  const wrapper = document.querySelector(containerId);
  if (!wrapper) return;

  try {
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
      console.error('Supabase client belum diinisialisasi.');
      return;
    }

    const { data, error } = await supabaseClient
      .from('a_klaster')
      .select('id, nama_klaster')
      .order('nama_klaster', { ascending: true });

    if (error) {
      console.error('Gagal memuat data klaster dari database:', error.message);
      return;
    }

    const formattedData = (data || []).map(item => ({
      value: item.id,
      label: item.nama_klaster
    }));


    const klasterSelecton = new Selecton(containerId, {
      placeholder: '-- Pilih Klaster Kebutuhan --',
      searchPlaceholder: '""',
      emptyText: 'Klaster tidak ditemukan',
      data: formattedData,
      onSelect: (selected) => {
        const hiddenInput = document.getElementById('klaster-value');
        if (hiddenInput) {
          hiddenInput.value = selected.value;
        }
      }
    });


    const savedKlasterId = sessionStorage.getItem('saved_klaster_id');
    if (savedKlasterId) {
      const hiddenInput = document.getElementById('klaster-value');
      if (hiddenInput) {
        hiddenInput.value = savedKlasterId;
      }
      

      klasterSelecton.setValue(savedKlasterId);
    }

  } catch (err) {
    console.error('Terjadi kesalahan saat memuat klaster:', err);
  }
}




async function initBarangJasaSelecton() {
  const containerId = '#barang-jasa-container';
  const wrapper = document.querySelector(containerId);
  if (!wrapper) return;

  const specInput = document.getElementById('spesifikasi');
  const satuanInput = document.getElementById('satuan');
  const hargaInput = document.getElementById('harga-satuan');
  const kuantitasInput = document.getElementById('kuantitas');
  const totalInput = document.getElementById('total-nominal');

  if (specInput) specInput.readOnly = true;
  if (satuanInput) satuanInput.readOnly = true;
  if (hargaInput) hargaInput.readOnly = true;

  let selectedItemHarga = 0;
  let currentQuery = '';
  let currentPage = 0;
  const pageSize = 10; // Muat 10 data per batch
  let isFetching = false;
  let hasMoreData = true;
  let activeMasterData = []; // Menyimpan cache data yang sedang aktif ditampilkan


  const barangSelecton = new Selecton(containerId, {
    placeholder: '-- Pilih Barang/Jasa --',
    searchPlaceholder: 'Ketik minimal 2 karakter...',
    emptyText: 'Ketik minimal 2 karakter untuk mencari...',
    data: [],


    onSearch: (query, instance) => {
      currentQuery = query.trim();


      if (currentQuery.length < 2) {
        instance.setData([]);
        activeMasterData = [];


        setTimeout(() => {
          const emptyEl = instance.resultsList.querySelector('.selecton-empty');
          if (emptyEl) emptyEl.textContent = 'Ketik minimal 2 karakter untuk mencari...';
        }, 0);
        return;
      }


      clearTimeout(window.barangSearchTimer);
      window.barangSearchTimer = setTimeout(() => {
        currentPage = 0;
        hasMoreData = true;
        fetchBarangData(currentQuery, currentPage, true, instance);
      }, 300);
    },


    onScrollEnd: (instance) => {
      if (isFetching || !hasMoreData || currentQuery.length < 2) return;
      currentPage++;
      fetchBarangData(currentQuery, currentPage, false, instance);
    },


    onSelect: (selected) => {

      const item = activeMasterData.find(d => d.id === selected.value);
      if (item) {
        specInput.value = item.tipe_merk || '-';
        satuanInput.value = item.satuan || '';

        selectedItemHarga = Number(item.harga_referensi) || 0;
        hargaInput.value = selectedItemHarga;

        const hiddenInput = document.getElementById('barang-value');
        if (hiddenInput) {
          hiddenInput.value = item.id; // <-- BENAR (menggunakan UUID barang)
        }

        calculateTotal();
      } else {
        clearAutofillFields();
      }
    }
  });


  async function fetchBarangData(queryText, page, isNewSearch, instance) {
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) return;

    isFetching = true;
    if (isNewSearch) {
      instance.setLoading(true);
    }

    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;


      let query = supabaseClient
        .from('b_master_barang')
        .select('id, nama_barang, tipe_merk, satuan, harga_referensi, kode_barang_jasa')
        .eq('aktif', true)
        .or(`nama_barang.ilike.%${queryText}%,kode_barang_jasa.ilike.%${queryText}%`)
        .order('nama_barang', { ascending: true })
        .range(from, to);

      const { data, error } = await query;

      if (error) {
        console.error('Gagal mengambil data barang dari Supabase:', error.message);
        isFetching = false;
        instance.setLoading(false);
        return;
      }

      const fetchedList = data || [];


      if (isNewSearch && fetchedList.length === 0) {
        instance.setData([]);
        activeMasterData = [];
        setTimeout(() => {
          const emptyEl = instance.resultsList.querySelector('.selecton-empty');
          if (emptyEl) emptyEl.textContent = 'Barang atau jasa tidak ditemukan';
        }, 0);
        isFetching = false;
        instance.setLoading(false);
        return;
      }


      if (fetchedList.length < pageSize) {
        hasMoreData = false;
      }


      const formattedBatch = fetchedList.map(item => ({
        value: item.id,
        label: `${item.nama_barang} ${item.tipe_merk ? '(' + item.tipe_merk + ')' : ''}`
      }));

      if (isNewSearch) {
        activeMasterData = fetchedList;
        instance.setData(formattedBatch);
      } else {

        activeMasterData = [...activeMasterData, ...fetchedList];
        const combinedData = [...instance.options.data, ...formattedBatch];
        instance.setData(combinedData);
      }

    } catch (err) {
      console.error('Terjadi kesalahan saat fetch data barang:', err);
    } finally {
      isFetching = false;
      instance.setLoading(false);
    }
  }

  if (kuantitasInput) {
    kuantitasInput.addEventListener('input', function () {
      calculateTotal();
    });
  }

  function calculateTotal() {
    const qty = parseFloat(kuantitasInput.value) || 0;
    const total = qty * selectedItemHarga;
    totalInput.value = formatRupiah(total);
  }

  function clearAutofillFields() {
    specInput.value = '';
    satuanInput.value = '';
    hargaInput.value = '';
    selectedItemHarga = 0;
    calculateTotal();
  }
}




async function initUnitSasaranSelecton() {
  const containerId = '#unit-sasaran-container';
  const wrapper = document.querySelector(containerId);
  if (!wrapper) return;

  try {
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
      console.error('Supabase client belum diinisialisasi.');
      return;
    }


    const { data, error } = await supabaseClient
      .from('a_ruang_tujuan')
      .select('id, nama_ruang')
      .eq('aktif', true)
      .order('nama_ruang', { ascending: true });

    if (error) {
      console.error('Gagal memuat data ruang tujuan dari database:', error.message);
      return;
    }


    const formattedData = (data || []).map(item => ({
      value: item.id,         // UUID unik ruang tujuan
      label: item.nama_ruang  // Nama ruang yang tampil di UI
    }));


    const unitSelecton = new Selecton(containerId, {
      placeholder: '-- Pilih Unit Sasaran --',
      searchPlaceholder: '""',
      emptyText: 'Unit sasaran tidak ditemukan',
      data: formattedData,
      onSelect: (selected) => {
        const hiddenInput = document.getElementById('unit-sasaran-value');
        if (hiddenInput) {
          hiddenInput.value = selected.value; // Menyimpan UUID ruang terpilih
        }
      }
    });


    const savedUnitId = sessionStorage.getItem('saved_unit_sasaran_id'); // Sesuaikan key storage jika berbeda
    if (savedUnitId) {
      const hiddenInput = document.getElementById('unit-sasaran-value');
      if (hiddenInput) {
        hiddenInput.value = savedUnitId;
      }
      

      unitSelecton.setValue(savedUnitId);
    }

  } catch (err) {
    console.error('Terjadi kesalahan saat memuat unit sasaran:', err);
  }
}




async function initNomorDokumenPreview() {
  const inputNomor = document.getElementById('nomor-dokumen');
  if (!inputNomor) return;

  try {
    const supabaseClient = window.supabaseClient;
    const userProfile = window.currentUserProfile;


    if (!supabaseClient || !userProfile || !userProfile.instansi_id) {
      inputNomor.value = 'Menunggu profil instansi...';
      return;
    }

    const currentYear = new Date().getFullYear();
    const jenisTarget = 'USULAN'; // Sesuai halaman usulan


    const { data: nomorPreview, error } = await supabaseClient.rpc('preview_nomor_dokumen', {
      p_instansi_id: userProfile.instansi_id,
      p_jenis_dokumen: jenisTarget,
      p_tahun_anggaran: currentYear
    });

    if (error) {
      console.error('Gagal memuat preview nomor dokumen:', error.message);
      inputNomor.value = 'Gagal memuat';
      return;
    }


    inputNomor.value = nomorPreview || '-';

  } catch (err) {
    console.error('Terjadi kesalahan tak terduga pada preview nomor:', err);
    inputNomor.value = '-';
  }
}




function initPeriodeKebutuhanRestriction() {
  const bulanIds = [
    { id: 'bln-januari', monthIndex: 0 },
    { id: 'bln-februari', monthIndex: 1 },
    { id: 'bln-maret', monthIndex: 2 },
    { id: 'bln-april', monthIndex: 3 },
    { id: 'bln-mei', monthIndex: 4 },
    { id: 'bln-juni', monthIndex: 5 },
    { id: 'bln-juli', monthIndex: 6 },
    { id: 'bln-agustus', monthIndex: 7 },
    { id: 'bln-september', monthIndex: 8 },
    { id: 'bln-oktober', monthIndex: 9 },
    { id: 'bln-november', monthIndex: 10 },
    { id: 'bln-desember', monthIndex: 11 }
  ];


  const activeYear = parseInt(localStorage.getItem('active_year')) || new Date().getFullYear();
  const now = new Date();
  const deviceYear = now.getFullYear();
  const deviceMonth = now.getMonth(); // 0 = Januari, ..., 9 = Oktober

  bulanIds.forEach(item => {
    const inputEl = document.getElementById(item.id);
    if (!inputEl) return;


    inputEl.disabled = false;
    inputEl.classList.remove('readonly-input');

    if (activeYear < deviceYear) {

      inputEl.disabled = true;
      inputEl.classList.add('readonly-input');
      inputEl.value = '';
    } else if (activeYear > deviceYear) {

      inputEl.disabled = false;
    } else {



      if (deviceMonth >= 9 && item.monthIndex <= 8) {
        inputEl.disabled = true;
        inputEl.classList.add('readonly-input');
        inputEl.value = '';
      }
    }
  });


  const btnBagiRata = document.getElementById('btn-bagi-rata');
  if (btnBagiRata) {
    btnBagiRata.style.display = (activeYear < deviceYear) ? 'none' : '';
  }
}




document.getElementById('btn-bagi-rata').addEventListener('click', function () {
  const inputKuantitas = document.getElementById('kuantitas');
  if (!inputKuantitas) return;

  const totalKuantitas = parseFloat(inputKuantitas.value) || 0;

  if (totalKuantitas <= 0) {
    alert('Masukkan jumlah kuantitas utama terlebih dahulu!');
    inputKuantitas.focus();
    return;
  }


  const bulanIds = [
    'bln-januari', 'bln-februari', 'bln-maret', 'bln-april',
    'bln-mei', 'bln-juni', 'bln-juli', 'bln-agustus',
    'bln-september', 'bln-oktober', 'bln-november', 'bln-desember'
  ];


  const baseValue = Math.floor(totalKuantitas / 12);
  let remainder = totalKuantitas % 12; // Sisa pembagian jika ada desimal/tidak pas

  bulanIds.forEach((id, index) => {
    const inputBulan = document.getElementById(id);
    if (inputBulan) {

      const assignedValue = baseValue + (index < remainder ? 1 : 0);
      inputBulan.value = assignedValue;
    }
  });
});




document.addEventListener('DOMContentLoaded', function () {
  const btnKirim = document.getElementById('btn-kirim-usulan'); // Sesuaikan ID tombol submit Anda di HTML
  if (btnKirim) {
    btnKirim.addEventListener('click', handleKirimUsulan);
  }
});

async function handleKirimUsulan(e) {
  if (e) e.preventDefault();

  const supabaseClient = window.supabaseClient;
  if (!supabaseClient) {
    alert('Klien Supabase belum siap.');
    return;
  }


  const tahunAnggaran = new Date().getFullYear();
  const barangIdInput = document.getElementById('barang-value'); 
  const ruangTujuanInput = document.getElementById('unit-sasaran-value'); 
  const catatanInput = document.getElementById('catatan-pengusul'); 
  const linkReferensiInput = document.getElementById('link-referensi'); // <-- PASTIKAN INI ADA

  const barangId = barangIdInput ? barangIdInput.value : '';
  const ruangTujuanId = ruangTujuanInput ? ruangTujuanInput.value : null;
  const catatanPengusul = catatanInput ? catatanInput.value.trim() : null;
  const linkReferensi = linkReferensiInput ? linkReferensiInput.value.trim() : null; // <-- PASTIKAN INI ADA


  const bulanIds = [
    { bulan: 1, id: 'bln-januari' },
    { bulan: 2, id: 'bln-februari' },
    { bulan: 3, id: 'bln-maret' },
    { bulan: 4, id: 'bln-april' },
    { bulan: 5, id: 'bln-mei' },
    { bulan: 6, id: 'bln-juni' },
    { bulan: 7, id: 'bln-juli' },
    { bulan: 8, id: 'bln-agustus' },
    { bulan: 9, id: 'bln-september' },
    { bulan: 10, id: 'bln-oktober' },
    { bulan: 11, id: 'bln-november' },
    { bulan: 12, id: 'bln-desember' }
  ];

  const jadwalArray = [];
  bulanIds.forEach(item => {
    const inputEl = document.getElementById(item.id);
    if (inputEl) {
      const jumlahVal = parseFloat(inputEl.value) || 0;
      if (jumlahVal > 0) {
        jadwalArray.push({ bulan: item.bulan, jumlah: jumlahVal });
      }
    }
  });


  if (!barangId) {
    alert('Silakan pilih barang atau jasa terlebih dahulu!');
    return;
  }

  if (jadwalArray.length === 0) {
    alert('Mohon isi rincian kuantitas kebutuhan pada minimal satu bulan!');
    return;
  }


  if (!confirm('Apakah Anda yakin ingin mengirim usulan kebutuhan ini?')) {
    return;
  }

  try {

    const { data: response, error } = await supabaseClient.rpc('submit_usulan_kebutuhan', {
      p_tahun_anggaran: tahunAnggaran,
      p_barang_id: barangId,
      p_ruang_tujuan_id: ruangTujuanId || null,
      p_kode_rekening_id: null, 
      p_catatan_pengusul: catatanPengusul,
      p_link_referensi: linkReferensi, // <-- Variabel ini yang tadinya belum dideklarasikan
      p_jadwal: jadwalArray
    });

    if (error) {
      console.error('Gagal mengirim usulan:', error.message);
      alert('Terjadi kesalahan pada sistem database: ' + error.message);
      return;
    }

    if (response && response.success) {
      alert(`Berhasil! Usulan tersimpan dengan Nomor: ${response.nomor_usulan}`);


      const klasterHidden = document.getElementById('klaster-value');
      sessionStorage.setItem('saved_klaster_id', klasterHidden ? klasterHidden.value : '');
      sessionStorage.setItem('saved_unit_sasaran_id', ruangTujuanInput ? ruangTujuanInput.value : '');
      sessionStorage.setItem('saved_catatan', catatanPengusul || '');
      sessionStorage.setItem('saved_link_referensi', linkReferensi || '');

      window.location.reload();
    } else {
      console.error('Respon gagal dari RPC:', response);
      alert('Gagal menyimpan usulan: ' + (response?.message || 'Kesalahan tidak diketahui dari server.'));
    }

  } catch (err) {
    console.error('Terjadi kesalahan tak terduga:', err);
    alert('Terjadi kesalahan jaringan atau aplikasi.');
  }
}

function restoreSavedFormState() {

  const savedCatatan = sessionStorage.getItem('saved_catatan');
  const catatanInput = document.getElementById('catatan-pengusul');
  if (catatanInput && savedCatatan) {
    catatanInput.value = savedCatatan;
  }


  const savedLink = sessionStorage.getItem('saved_link_referensi');
  const linkReferensiInput = document.getElementById('link-referensi');
  if (linkReferensiInput && savedLink) {
    linkReferensiInput.value = savedLink;
  }


  const savedKlasterId = sessionStorage.getItem('saved_klaster_id');
  const hiddenKlaster = document.getElementById('klaster-value');
  if (hiddenKlaster && savedKlasterId) {
    hiddenKlaster.value = savedKlasterId;
  }

  const savedUnitId = sessionStorage.getItem('saved_unit_sasaran_id');
  const hiddenUnit = document.getElementById('unit-sasaran-value');
  if (hiddenUnit && savedUnitId) {
    hiddenUnit.value = savedUnitId;
  }
}




function resetFormTotal() {
  if (!confirm('Apakah Anda yakin ingin membersihkan semua input form?')) {
    return;
  }


  sessionStorage.removeItem('saved_klaster_id');
  sessionStorage.removeItem('saved_unit_sasaran_id');
  sessionStorage.removeItem('saved_catatan');
  sessionStorage.removeItem('saved_link_referensi');


  const form = document.querySelector('form'); // Pastikan form Anda terbungkus tag <form> atau sesuaikan selector-nya
  if (form) {
    form.reset();
  }


  const hiddenKlaster = document.getElementById('klaster-value');
  const hiddenBarang = document.getElementById('barang-value');
  const hiddenUnit = document.getElementById('unit-sasaran-value');
  

  if (hiddenKlaster) hiddenKlaster.value = '';
  if (hiddenBarang) hiddenBarang.value = '';
  if (hiddenUnit) hiddenUnit.value = '';


  const specInput = document.getElementById('spesifikasi');
  const satuanInput = document.getElementById('satuan');
  const hargaInput = document.getElementById('harga-satuan');
  const totalInput = document.getElementById('total-nominal');

  if (specInput) specInput.value = '';
  if (satuanInput) satuanInput.value = '';
  if (hargaInput) hargaInput.value = '';
  if (totalInput) totalInput.value = '';


  const kuantitasInput = document.getElementById('kuantitas');
  if (kuantitasInput) kuantitasInput.value = '';

  const bulanIds = [
    'bln-januari', 'bln-februari', 'bln-maret', 'bln-april',
    'bln-mei', 'bln-juni', 'bln-juli', 'bln-agustus',
    'bln-september', 'bln-oktober', 'bln-november', 'bln-desember'
  ];

  bulanIds.forEach(id => {
    const inputBulan = document.getElementById(id);
    if (inputBulan) inputBulan.value = '';
  });


  window.location.reload();
}

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}