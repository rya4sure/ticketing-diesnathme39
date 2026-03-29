const dbClient = window.supabase.createClient(
  CONFIG.supabase.url,
  CONFIG.supabase.anonKey
)

async function validasi() {
  const kode = document.getElementById('kode-input').value.trim().toUpperCase()
  const result = document.getElementById('result')
  const title = document.getElementById('result-title')
  const detail = document.getElementById('result-detail')
  const btn = document.getElementById('btn-validasi')

  if (!kode) {
    tampilResult('gagal', 'Kode kosong', 'Masukkan kode tiket terlebih dahulu.')
    return
  }

  btn.disabled = true
  btn.textContent = 'Mengecek...'
  result.style.display = 'none'

  const { data, error } = await dbClient
    .from('peserta')
    .select('*')
    .eq('kode_tiket', kode)
    .single()

  if (error || !data) {
    tampilResult('gagal', 'Tiket tidak ditemukan', 'Kode "' + kode + '" tidak terdaftar.')
    btn.disabled = false
    btn.textContent = 'Validasi Tiket'
    return
  }

  if (data.sudah_hadir) {
    tampilResult('gagal', 'Tiket sudah digunakan!', data.nama + ' sudah check-in sebelumnya.')
    btn.disabled = false
    btn.textContent = 'Validasi Tiket'
    return
  }

  const { error: updateError } = await dbClient
    .from('peserta')
    .update({ sudah_hadir: true })
    .eq('kode_tiket', kode)

  if (updateError) {
    tampilResult('gagal', 'Gagal update', 'Coba lagi.')
    btn.disabled = false
    btn.textContent = 'Validasi Tiket'
    return
  }

  tampilResult('sukses', 'Selamat datang! ✓', data.nama + ' · ' + data.email + ' · ' + data.no_hp)
  document.getElementById('kode-input').value = ''
  btn.disabled = false
  btn.textContent = 'Validasi Tiket'
}

function tampilResult(tipe, judul, pesan) {
  const result = document.getElementById('result')
  result.className = 'result ' + tipe
  document.getElementById('result-title').textContent = judul
  document.getElementById('result-detail').textContent = pesan
  result.style.display = 'block'
}