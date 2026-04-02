const dbClient = window.supabase.createClient(
  CONFIG.supabase.url,
  CONFIG.supabase.anonKey
)

// GANTI DENGAN URL GOOGLE SCRIPT EMAIL POLBAN KAMU:
const GAS_URL = "https://script.google.com/macros/s/AKfycbzN8UpkQpm3DxMq0VX73lM3PsaeGgjIuEtFkxaB3_t4T0veuEgD4oM3Ka_DMVndmuWp/exec";

let isProcessing = false;
let pendingOtsData = null; 

async function validasi(scannedKode = null) {
  if (isProcessing) return; 

  const kode = (scannedKode || document.getElementById('kode-input').value).trim().toUpperCase()
  const result = document.getElementById('result')
  const btn = document.getElementById('btn-validasi')
  const btnOts = document.getElementById('btn-ots-konfirmasi')

  if (!kode) {
    tampilResult('gagal', 'Kode kosong', 'Masukkan atau Scan kode tiket terlebih dahulu.')
    btnOts.style.display = 'none';
    return
  }

  isProcessing = true
  btn.disabled = true
  btn.textContent = 'Mengecek...'
  result.style.display = 'none'
  btnOts.style.display = 'none'; 

  if (scannedKode) {
    document.getElementById('kode-input').value = kode;
  }

  const { data, error } = await dbClient
    .from('peserta')
    .select('*')
    .eq('kode_tiket', kode)
    .single()

  if (error || !data) {
    tampilResult('gagal', '❌ Tidak Ditemukan', 'Kode "' + kode + '" tidak terdaftar di sistem.')
    selesaiProses(btn)
    return
  }

  if (data.sudah_hadir) {
    tampilResult('gagal', '⚠️ Sudah Digunakan!', data.nama + ' sudah check-in sebelumnya.')
    selesaiProses(btn)
    return
  }

  if (data.status_bayar !== 'lunas') {
    let tagihan = data.harga ? 'Rp ' + data.harga.toLocaleString('id-ID') : 'Rp -';
    
    if (data.metode_bayar === 'ots') {
      pendingOtsData = data; 
      tampilResult('gagal', '⚠️ BELUM LUNAS (OTS)', `${data.nama} mendaftar On The Spot.\nTagihan: ${tagihan}`);
      btnOts.style.display = 'block'; 
    } else {
      tampilResult('gagal', '⚠️ BELUM LUNAS', `${data.nama} belum menyelesaikan pembayaran atau masih menunggu konfirmasi panitia.`);
    }
    
    selesaiProses(btn)
    return
  }

  const { error: updateError } = await dbClient
    .from('peserta')
    .update({ sudah_hadir: true })
    .eq('kode_tiket', kode)

  if (updateError) {
    tampilResult('gagal', '❌ Gagal Jaringan', 'Server sibuk, coba scan sekali lagi.')
    selesaiProses(btn)
    return
  }

  playBeep()
  tampilResult('sukses', '✅ Valid & Hadir!', data.nama + ' · Angkatan: ' + (data.angkatan||'-') + ' · Menu: ' + (data.menu||'-'))
  document.getElementById('kode-input').value = ''
  selesaiProses(btn)
}

async function konfirmasiOTS() {
  if (!pendingOtsData || isProcessing) return;
  isProcessing = true;

  const btnOts = document.getElementById('btn-ots-konfirmasi');
  btnOts.disabled = true;
  btnOts.textContent = 'Memproses...';

  const { error } = await dbClient
    .from('peserta')
    .update({ status_bayar: 'lunas', sudah_hadir: true })
    .eq('kode_tiket', pendingOtsData.kode_tiket);

  if (error) {
    alert('Gagal update database: ' + error.message);
    btnOts.disabled = false;
    btnOts.textContent = 'Terima Uang & Konfirmasi Hadir';
    isProcessing = false;
    return;
  }

  playBeep();

  tampilResult('sukses', '✅ Lunas & Hadir!', pendingOtsData.nama + ' telah bayar tunai dan otomatis Check-in.');
  btnOts.style.display = 'none';
  btnOts.disabled = false;
  btnOts.textContent = 'Terima Uang & Konfirmasi Hadir';
  document.getElementById('kode-input').value = '';

  if (GAS_URL && GAS_URL !== "MASUKKAN_URL_GOOGLE_SCRIPT_DI_SINI") {
    fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        nama: pendingOtsData.nama,
        email: pendingOtsData.email,
        kode_tiket: pendingOtsData.kode_tiket,
        menu: pendingOtsData.menu
      })
    }).catch(e => console.log('Email gagal terkirim'));
  }

  pendingOtsData = null;
  isProcessing = false;
}

function selesaiProses(btn) {
  isProcessing = false
  btn.disabled = false
  btn.textContent = 'Validasi Tiket'
}

function tampilResult(tipe, judul, pesan) {
  const result = document.getElementById('result')
  result.className = 'result ' + tipe
  document.getElementById('result-title').textContent = judul
  document.getElementById('result-detail').innerText = pesan 
  result.style.display = 'block'
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.15); 
  } catch(e) {}
}

function onScanSuccess(decodedText, decodedResult) {
    validasi(decodedText);
}

function onScanFailure(error) {}

document.addEventListener('DOMContentLoaded', () => {
    let html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: {width: 250, height: 250} },
      false);
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
});