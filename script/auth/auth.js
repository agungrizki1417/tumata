


document.addEventListener('DOMContentLoaded', async function () {
  const sb = window.supabaseClient;
  if (!sb) {
    console.error('Supabase client belum siap.');
    return;
  }


  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', async function (e) {
      e.preventDefault();

      const nipInput = document.getElementById('username').value.trim();
      const passwordInput = document.getElementById('password').value;
      const selectedYear = document.getElementById('login-year').value;

      if (!nipInput || !passwordInput || !selectedYear) {
        alert('NIP, Kata Sandi, dan Tahun Anggaran wajib diisi.');
        return;
      }

      const email = `${nipInput}@tumata.co.id`;

      try {
        const { error } = await sb.auth.signInWithPassword({
          email: email,
          password: passwordInput,
        });

        if (error) {
          throw new Error(error.message);
        }

        localStorage.setItem('active_year', selectedYear);


        window.location.href = 'views/dashboard.html';
      } catch (err) {
        alert('Gagal masuk: Periksa kembali NIP atau kata sandi Anda.');
        console.error(err);
      }
    });
    return; // Hentikan eksekusi agar tidak lanjut ke script dashboard
  }


  try {

    const { data: { session }, error: sessionError } = await sb.auth.getSession();

    if (sessionError || !session) {
      window.location.href = '../index.html';
      return;
    }

    const user = session.user;


    const [profileRes] = await Promise.all([
      sb.from('a_pengguna').select('nama_lengkap, nip, unit_kerja_id, instansi_id').eq('id', user.id).maybeSingle(),
    ]);

    if (profileRes.error) {
      console.error('Gagal memuat profil pengguna:', profileRes.error);
      return;
    }

    const profile = profileRes.data;
    if (!profile) {
      console.warn('Data profil belum terdaftar di tabel a_pengguna.');
      return;
    }


    window.currentUserProfile = profile;


    document.dispatchEvent(new CustomEvent('userProfileReady', { detail: profile }));


    renderHeaderProfile(profile, user.email);

  } catch (err) {
    console.error('Terjadi kesalahan pada modul auth/profil:', err);
  }
});


function renderHeaderProfile(profile, email) {
  const nama = profile.nama_lengkap || 'Pengguna';


  const initials = nama
    .trim()
    .split(/\s+/)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const elAvatar = document.getElementById('header-user-avatar');
  const elName = document.getElementById('header-user-name');
  const elRole = document.getElementById('header-user-role');

  if (elAvatar) elAvatar.textContent = initials;
  if (elName) elName.textContent = nama;


  if (elRole) elRole.textContent = profile.nip ? `NIP. ${profile.nip}` : 'Pegawai';
}


async function handleLogout() {
  const confirmLogout = confirm('Apakah Anda yakin ingin keluar dari sistem?');
  if (!confirmLogout) return;

  try {
    const sb = window.supabaseClient;
    if (sb && sb.auth) {
      await sb.auth.signOut();
    }
  } catch (err) {
    console.error('Gagal logout dari server:', err);
  } finally {
    localStorage.clear();
    sessionStorage.clear();

    const isInsideViews = window.location.pathname.includes('/views/');
    window.location.href = isInsideViews ? '../index.html' : 'index.html';
  }
}