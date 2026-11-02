/**
 * HALAMAN: Kontrol Laporan Usulan
 * Mengatur pilihan parameter cetak dokumen menggunakan komponen Selecton
 */

document.addEventListener('DOMContentLoaded', function () {
  initReportControls();
});

let selectonFormat, selectonTipePeriode, selectonBulan, selectonTahun;

function initReportControls() {
  const containerBulan = document.getElementById('container-bulan');
  const btnCetak = document.getElementById('btn-cetak-pdf');
  const btnReset = document.getElementById('btn-reset-filter');


  selectonFormat = new Selecton('#selecton-format-laporan', {
    placeholder: '-- Silakan Pilih --',
    searchPlaceholder: 'Cari format...',
    data: [
      { value: '', label: '-- Silakan Pilih --' },
      { value: 'RUK', label: 'Rencana Usulan Kegiatan (RUK)' },
      { value: 'RBA', label: 'Rencana Bisnis dan Anggaran (RBA)' },
      { value: 'RKBJ', label: 'Rencana Kebutuhan Barang/Jasa (RKBJ)' }
    ],
    onSelect: (selected) => {
      document.getElementById('format-laporan-value').value = selected.value;
    }
  });
  selectonFormat.setValue('');


  selectonTipePeriode = new Selecton('#selecton-tipe-periode', {
    placeholder: '-- Silakan Pilih --',
    searchPlaceholder: 'Cari periode...',
    data: [
      { value: '', label: '-- Silakan Pilih --' },
      { value: 'tahun', label: 'Per Tahun (Tahunan)' },
      { value: 'bulan', label: 'Per Bulan (Bulanan)' }
    ],
    onSelect: (selected) => {
      document.getElementById('tipe-periode-value').value = selected.value;
      if (selected.value === 'bulan') {
        containerBulan.style.display = 'flex';
      } else {
        containerBulan.style.display = 'none';
      }
    }
  });
  selectonTipePeriode.setValue('');


  selectonBulan = new Selecton('#selecton-pilih-bulan', {
    placeholder: '-- Silakan Pilih --',
    searchPlaceholder: 'Cari bulan...',
    data: [
      { value: '', label: '-- Silakan Pilih --' },
      { value: '1', label: 'Januari' },
      { value: '2', label: 'Februari' },
      { value: '3', label: 'Maret' },
      { value: '4', label: 'April' },
      { value: '5', label: 'Mei' },
      { value: '6', label: 'Juni' },
      { value: '7', label: 'Juli' },
      { value: '8', label: 'Agustus' },
      { value: '9', label: 'September' },
      { value: '10', label: 'Oktober' },
      { value: '11', label: 'November' },
      { value: '12', label: 'Desember' }
    ],
    onSelect: (selected) => {
      document.getElementById('pilih-bulan-value').value = selected.value;
    }
  });
  selectonBulan.setValue('');


  selectonTahun = new Selecton('#selecton-pilih-tahun', {
    placeholder: '-- Silakan Pilih --',
    searchPlaceholder: 'Cari tahun...',
    data: [
      { value: '', label: '-- Silakan Pilih --' },
      { value: '2026', label: '2026' },
      { value: '2025', label: '2025' },
      { value: '2024', label: '2024' }
    ],
    onSelect: (selected) => {
      document.getElementById('pilih-tahun-value').value = selected.value;
    }
  });
  selectonTahun.setValue('');


  if (btnCetak) {
    btnCetak.addEventListener('click', function () {
      const format = document.getElementById('format-laporan-value')?.value;
      const tipe = document.getElementById('tipe-periode-value')?.value;
      const tahun = document.getElementById('pilih-tahun-value')?.value;
      const bulan = document.getElementById('pilih-bulan-value')?.value;
      const namaPejabat = document.getElementById('nama-pejabat')?.value?.trim();
      const nipPejabat = document.getElementById('nip-pejabat')?.value?.trim();


      if (!format) {
        alert('Silakan pilih Format Dokumen Laporan terlebih dahulu.');
        return;
      }
      if (!tipe) {
        alert('Silakan pilih Jenis Periode terlebih dahulu.');
        return;
      }
      if (tipe === 'bulan' && !bulan) {
        alert('Silakan pilih Bulan terlebih dahulu.');
        return;
      }
      if (!tahun) {
        alert('Silakan pilih Tahun Anggaran terlebih dahulu.');
        return;
      }
      if (!namaPejabat) {
        alert('Mohon isi nama pejabat penandatangan dokumen terlebih dahulu.');
        document.getElementById('nama-pejabat')?.focus();
        return;
      }

      console.log('Parameter Cetak Laporan:', {
        format,
        tipe,
        tahun,
        bulan: tipe === 'bulan' ? bulan : 'Semua',
        namaPejabat,
        nipPejabat
      });


      window.print();
    });
  }


  if (btnReset) {
    btnReset.addEventListener('click', function () {
      selectonFormat.setValue('');
      document.getElementById('format-laporan-value').value = '';

      selectonTipePeriode.setValue('');
      document.getElementById('tipe-periode-value').value = '';
      containerBulan.style.display = 'none';

      selectonBulan.setValue('');
      document.getElementById('pilih-bulan-value').value = '';

      selectonTahun.setValue('');
      document.getElementById('pilih-tahun-value').value = '';

      document.getElementById('nama-pejabat').value = '';
      document.getElementById('nip-pejabat').value = '';
    });
  }
}