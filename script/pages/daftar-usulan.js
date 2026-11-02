document.addEventListener('DOMContentLoaded', function () {
  if (window.currentUserProfile && window.currentUserProfile.instansi_id) {
    loadDaftarUsulan();
  } else {
    document.addEventListener('userProfileReady', () => {
      loadDaftarUsulan();
    }, { once: true });
  }
});

const STATUS_CONFIG = {
  draf: {
    bg: '#F1F5F9',
    text: '#475569',
    label: 'Draf'
  },
  disetujui: {
    bg: '#DCFCE7',
    text: '#166534',
    label: 'Disetujui'
  },
  ditolak: {
    bg: '#FEE2E2',
    text: '#991B1B',
    label: 'Ditolak'
  }
};

async function loadDaftarUsulan() {
  const containerId = '#tabel-daftar-usulan-container';
  const supabaseClient = window.supabaseClient;

  if (!supabaseClient) {
    console.error('Supabase client belum diinisialisasi.');
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('c_usulan_kebutuhan')
      .select(`
        id,
        nomor_usulan,
        harga_satuan,
        status,
        b_master_barang (
          nama_barang,
          satuan
        ),
        c_jadwal_kebutuhan (
          jumlah
        )
        c_rincian_bulanan_usulan (
          bulan,
          jumlah
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Gagal memuat daftar usulan:', error.message);
      renderTableUsulan(containerId, []);
      return;
    }

    const formattedData = (data || []).map((item, index) => {
      const totalJumlah = (item.c_jadwal_kebutuhan || []).reduce((acc, curr) => acc + Number(curr.jumlah || 0), 0);
      const totalNominal = totalJumlah * Number(item.harga_satuan || 0);

      return {
        id: item.id,
        no_urut: index + 1,
        nama_barang: item.b_master_barang?.nama_barang || 'Barang tidak ditemukan',
        jumlah_usulan: `${totalJumlah} ${item.b_master_barang?.satuan || ''}`.trim(),
        nominal_usulan: formatRupiah(totalNominal),
        status: item.status || 'draf'
      };
    });

    renderTableUsulan(containerId, formattedData);

  } catch (err) {
    console.error('Terjadi kesalahan tak terduga saat memuat daftar usulan:', err);
    renderTableUsulan(containerId, []);
  }
}

function renderTableUsulan(containerId, dataUsulan) {
  new TableBuilder(containerId, {
    columns: [
      {
        key: 'no_urut',
        label: 'No.',
        width: '20px',
        headerAlign: 'center', // Header rata tengah
        align: 'center',         // Isi data rata tengah
        render: (val) => `<span class="td-main">${val}</span>`
      },
      {
        key: 'nama_barang',
        label: 'Nama Barang / Jasa',
        headerAlign: 'center', // Header ingin dibuat rata tengah...
        align: 'left',         // ...tapi isi data tetap rata kiri agar rapi
        render: (val) => `<span class="td-main">${val}</span>`
      },
      {
        key: 'jumlah_usulan',
        label: 'Jumlah Usulan',
        width: '130px',
        headerAlign: 'center',
        align: 'center',
        render: (val) => `<span class="td-main">${val}</span>`
      },
      {
        key: 'nominal_usulan',
        label: 'Nominal Usulan',
        width: '180px',
        headerAlign: 'center',
        align: 'right',          // Header tengah, angka nominal rata kanan
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
          const config = STATUS_CONFIG[key] || {
            bg: '#F1F5F9',
            text: '#475569',
            label: val || '-'
          };

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
        width: '120px',
        headerAlign: 'center',
        align: 'right',          // Header tengah, tombol aksi di kanan
        render: (val) => `
          <div style="display: inline-flex; align-items: center; gap: 0.375rem;">
            <button type="button" class="btn-icon-square" title="Lihat Detail" onclick="handleDetail('${val}')">
              <span data-icon="lihat-detail"></span>
            </button>
            <button type="button" class="btn-icon-square" title="Edit" onclick="handleEdit('${val}')">
              <span data-icon="edit"></span>
            </button>
            <button type="button" class="btn-icon-square" title="Hapus" onclick="handleHapus('${val}')" style="color: var(--color-rose, #DC2626);">
              <span data-icon="hapus"></span>
            </button>
          </div>
        `
      }
    ],
    data: dataUsulan,
    emptyText: 'Belum ada data usulan.'
  });

  if (typeof window.initIcons === 'function') {
    window.initIcons();
  } else if (typeof window.renderIcons === 'function') {
    window.renderIcons();
  }
}

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

function handleDetail(id) {
  console.log('Lihat detail data ID:', id);
}

function handleEdit(id) {
  console.log('Edit data ID:', id);
}

async function handleHapus(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus data usulan ini?')) {
    return;
  }

  const supabaseClient = window.supabaseClient;
  if (!supabaseClient) return;

  try {
    const { error } = await supabaseClient
      .from('c_usulan_kebutuhan')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Gagal menghapus usulan: ' + error.message);
      return;
    }

    alert('Usulan berhasil dihapus.');
    loadDaftarUsulan();

  } catch (err) {
    console.error('Terjadi kesalahan saat menghapus:', err);
    alert('Terjadi kesalahan jaringan atau sistem.');
  }
}




async function handleDetail(id) {
  const supabaseClient = window.supabaseClient;
  if (!supabaseClient || !window.globalModal) return;


  window.globalModal.open({
    title: 'Memuat Detail Usulan...',
    size: 'lg',
    content: '<div style="text-align: center; padding: 2rem;">Sedang mengambil data dari server...</div>'
  });

  try {

    const { data, error } = await supabaseClient
      .from('c_usulan_kebutuhan')
      .select(`
        id,
        nomor_usulan,
        tahun_anggaran,
        tanggal_usulan,
        status,
        catatan_pengusul,
        link_referensi,
        harga_satuan,
        b_master_barang (
          nama_barang,
          tipe_merk,
          satuan,
          harga_referensi
        ),
        a_ruang_tujuan (
          nama_ruang
        ),
        a_pengguna!pengusul_id (
          nama_lengkap,
          nip
        ),
        c_jadwal_kebutuhan (
          bulan,
          jumlah
        ),
        c_rincian_bulanan_usulan (
          bulan,
          jumlah
        ),
        c_riwayat_verifikasi (
          keputusan,
          catatan,
          tanggal_verifikasi
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Gagal mengambil detail usulan:', error?.message);
      window.globalModal.open({
        title: 'Kesalahan',
        size: 'sm',
        content: '<p>Gagal memuat data detail usulan dari server.</p>'
      });
      return;
    }


    let formattedDate = '-';
    if (data.tanggal_usulan) {
      const dateObj = new Date(data.tanggal_usulan);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const month = months[dateObj.getMonth()];
      const year = dateObj.getFullYear();
      formattedDate = `${day} ${month} ${year}`;
    }


    const jadwalMap = {};
    (data.c_jadwal_kebutuhan || []).forEach(item => {
      jadwalMap[item.bulan] = Number(item.jumlah) || 0;
    });


    const rincianVerifMap = {};
    (data.c_rincian_bulanan_usulan || []).forEach(item => {
      rincianVerifMap[item.bulan] = Number(item.jumlah) || 0;
    });

    const namaBulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    let totalVolumeUsulan = 0;
    let totalVolumeDisetujui = 0;
    let rowsBulanHtml = '';

    namaBulan.forEach((namaBln, index) => {
      const bulanKe = index + 1;
      const qtyUsulan = jadwalMap[bulanKe] || 0;
      totalVolumeUsulan += qtyUsulan;

      const qtyVerif = rincianVerifMap[bulanKe];
      const qtyDisetujui = qtyVerif !== undefined ? qtyVerif : '-';
      if (qtyVerif !== undefined) {
        totalVolumeDisetujui += qtyVerif;
      }

      rowsBulanHtml += `
        <tr>
          <td style="padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--color-border, #E2E5E8);">${namaBln}</td>
          <td style="padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--color-border, #E2E5E8); text-align: right;">${qtyUsulan > 0 ? qtyUsulan : '-'}</td>
          <td style="padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--color-border, #E2E5E8); text-align: right;">${qtyDisetujui}</td>
        </tr>
      `;
    });

    const totalNominal = totalVolumeUsulan * Number(data.harga_satuan || 0);
    const satuanBarang = data.b_master_barang?.satuan || '';


    const riwayatList = data.c_riwayat_verifikasi || [];

    riwayatList.sort((a, b) => new Date(b.tanggal_verifikasi) - new Date(a.tanggal_verifikasi));
    const riwayatTerakhir = riwayatList[0] || null;
    const catatanVerifikator = riwayatTerakhir?.catatan || '-';


    const modalContentHtml = `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        
        
        <div style="background: var(--color-bg-subtle, #F8FAFC); border: 1px solid var(--color-border, #E2E5E8); border-radius: 6px; padding: 1rem;">
          <h4 style="margin-bottom: 0.75rem;">Detail Usulan & Spesifikasi</h4>
          <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem;">
            <div>
              <span>Nomor Usulan</span>
              <div>${data.nomor_usulan || '-'}</div>
            </div>
            <div>
              <span>Tanggal Pengajuan</span>
              <div>${formattedDate}</div>
            </div>
            <div>
              <span>Tahun Anggaran</span>
              <div>${data.tahun_anggaran || '-'}</div>
            </div>
            <div>
              <span>Status Usulan</span>
              <div>${data.status || 'draf'}</div>
            </div>
            <div>
              <span>Nama Pengusul</span>
              <div>${data.a_pengguna?.nama_lengkap || '-'}</div>
            </div>
            <div>
              <span>Catatan Verifikator</span>
              <div>${catatanVerifikator}</div>
            </div>
          </div>
        </div>

        
        <div style="background: var(--color-bg-subtle, #F8FAFC); border: 1px solid var(--color-border, #E2E5E8); border-radius: 6px; padding: 1rem;">
          <h4 style="margin-bottom: 0.75rem;">Detail Barang & Sasaran</h4>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div>
              <span>Nama Barang / Jasa</span>
              <div>${data.b_master_barang?.nama_barang || 'Barang tidak ditemukan'}</div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem;">
              <div>
                <span>Spesifikasi / Merk</span>
                <div>${data.b_master_barang?.tipe_merk || '-'}</div>
              </div>
              <div>
                <span>Harga Satuan (Snapshot)</span>
                <div>${formatRupiah(data.harga_satuan)}</div>
              </div>
              <div>
                <span>Unit Sasaran</span>
                <div>${data.a_ruang_tujuan?.nama_ruang || 'Semua Unit / Umum'}</div>
              </div>
            </div>
            ${data.link_referensi ? `
              <div>
                <span>Link Referensi</span>
                <div><a href="${data.link_referensi}" target="_blank">Link Referensi</a></div>
              </div>
            ` : ''}
            ${data.catatan_pengusul ? `
              <div>
                <span>Catatan Pengusul</span>
                <div style="margin: 0; background: #FFFFFF; padding: 0.5rem; border: 1px solid var(--color-border); border-radius: 4px;">${data.catatan_pengusul}</div>
              </div>
            ` : ''}
          </div>
        </div>

        
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h4 style="margin: 0;">Rincian Jadwal Kebutuhan Bulanan</h4>
            <div>Total Nominal: ${formatRupiah(totalNominal)}</div>
          </div>
          
          <div style="border: 1px solid var(--color-border, #E2E5E8); border-radius: 6px; overflow: hidden; background: #FFFFFF;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: var(--color-bg-subtle, #F8FAFC); text-align: left; border-bottom: 1px solid var(--color-border, #E2E5E8);">
                  <th style="padding: 0.625rem 0.75rem;">Bulan</th>
                  <th style="padding: 0.625rem 0.75rem; text-align: right;">Jumlah Usulan (${satuanBarang})</th>
                  <th style="padding: 0.625rem 0.75rem; text-align: right;">Jumlah Disetujui (${satuanBarang})</th>
                </tr>
              </thead>
              <tbody>
                ${rowsBulanHtml}
              </tbody>
              <tfoot>
                <tr style="background-color: var(--color-bg-subtle, #F8FAFC); border-top: 1px solid var(--color-border, #E2E5E8);">
                  <td style="padding: 0.625rem 0.75rem;">Total Volume</td>
                  <td style="padding: 0.625rem 0.75rem; text-align: right;">${totalVolumeUsulan} ${satuanBarang}</td>
                  <td style="padding: 0.625rem 0.75rem; text-align: right;">${Object.keys(rincianVerifMap).length > 0 ? totalVolumeDisetujui + ' ' + satuanBarang : '-'}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>
    `;


    window.globalModal.open({
      title: `Detail Usulan`,
      size: 'lg',
      content: modalContentHtml
    });

  } catch (err) {
    console.error('Terjadi kesalahan saat memuat detail:', err);
    window.globalModal.open({
      title: 'Kesalahan Sistem',
      size: 'sm',
      content: '<p>Terjadi kesalahan jaringan atau aplikasi.</p>'
    });
  }
}