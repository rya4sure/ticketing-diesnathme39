const dbClient = window.supabase.createClient(
  CONFIG.supabase.url,
  CONFIG.supabase.anonKey
)

const HARGA = {
  '2025': 35000,
  '2024': 35000,
  '2023': 35000,
  'alumni': 45000
}

const LABEL_ANGKATAN = {
  '2025': '2025',
  '2024': '2024',
  '2023': '2023 & D4 2022',
  'alumni': 'Alumni'
}

function formatRupiah(angka) {
  return 'Rp ' + angka.toLocaleString('id-ID')
}

function updateHarga() {
  const angkatan = document.getElementById('angkatan').value
  const box = document.getElementById('harga-box')
  const wrapMetode = document.getElementById('wrap-metode')
  const wrapMenu = document.getElementById('wrap-menu')

  if (!angkatan) {
    box.style.display = 'none'
    wrapMetode.style.display = 'none'
    wrapMenu.style.display = 'none'
    return
  }

  document.getElementById('label-angkatan').textContent = LABEL_ANGKATAN[angkatan]
  document.getElementById('label-harga').textContent = formatRupiah(HARGA[angkatan])
  box.style.display = 'block'
  wrapMenu.style.display = 'block'
  wrapMetode.style.display = 'block'
}

function selectMenu(menuName, cardElement) {
  document.getElementById('menu').value = menuName
  document.querySelectorAll('.menu-card').forEach(card => card.classList.remove('active'))
  cardElement.classList.add('active')
  document.getElementById('wrap-metode').style.display = 'block'
  document.getElementById('err-menu').style.display = 'none'
}

function updateMetode() {
  const metode = document.getElementById('metode').value
  if (metode) {
    document.getElementById('err-metode').style.display = 'none'
  }
}

function validasiEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validasiHP(hp) {
  return /^(\+62|62|0)[0-9]{8,12}$/.test(hp.replace(/\s|-/g, ''))
}

function tampilErr(id, pesan) {
  const el = document.getElementById(id)
  el.textContent = pesan
  el.style.display = pesan ? 'block' : 'none'
}

function genKode() {
  return 'TF-' + Math.random().toString(36).substr(2, 6).toUpperCase()
}

async function daftar() {
  const nama = document.getElementById('nama').value.trim()
  const email = document.getElementById('email').value.trim()
  const hp = document.getElementById('hp').value.trim()
  const angkatan = document.getElementById('angkatan').value
  const menu = document.getElementById('menu').value
  const metode = document.getElementById('metode').value
  const btn = document.getElementById('btn-daftar')

  let valid = true

  if (!nama) { tampilErr('err-nama', 'Nama tidak boleh kosong.'); valid = false } else { tampilErr('err-nama', '') }
  if (!email) { tampilErr('err-email', 'Email tidak boleh kosong.'); valid = false } else if (!validasiEmail(email)) { tampilErr('err-email', 'Format email tidak valid.'); valid = false } else { tampilErr('err-email', '') }
  if (!hp) { tampilErr('err-hp', 'No. HP tidak boleh kosong.'); valid = false } else if (!validasiHP(hp)) { tampilErr('err-hp', 'Format No. HP tidak valid. Contoh: 081234567890'); valid = false } else { tampilErr('err-hp', '') }
  if (!angkatan) { tampilErr('err-angkatan', 'Pilih angkatan terlebih dahulu.'); valid = false } else { tampilErr('err-angkatan', '') }
  if (!menu) { tampilErr('err-menu', 'Pilih menu makanan terlebih dahulu.'); valid = false } else { tampilErr('err-menu', '') }
  if (!metode) { tampilErr('err-metode', 'Pilih metode pembayaran terlebih dahulu.'); valid = false } else { tampilErr('err-metode', '') }

  if (!valid) return

  btn.disabled = true
  btn.textContent = 'Memproses...'

  const kode = genKode()
  const harga = HARGA[angkatan]

  const { error } = await dbClient
    .from('peserta')
    .insert([{ nama, email, no_hp: hp, kode_tiket: kode, angkatan, harga, metode_bayar: metode, status_bayar: 'belum_bayar', menu: menu }])

  if (error) {
    document.getElementById('err-msg').textContent = 'Gagal mendaftar: ' + error.message
    document.getElementById('err-msg').style.display = 'block'
    btn.disabled = false
    btn.textContent = 'Lanjut Pembayaran'
    return
  }

  const angkatanLabel = LABEL_ANGKATAN[angkatan]
  window.location.href = `bayar.html?kode=${kode}&nama=${encodeURIComponent(nama)}&angkatan=${encodeURIComponent(angkatanLabel)}&harga=${harga}&metode=${metode}&menu=${encodeURIComponent(menu)}`
}