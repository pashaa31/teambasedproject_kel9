const API='/api';
const map=L.map('map').setView([-0.9008,119.870],12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors'}).addTo(map);
const markers=L.layerGroup().addTo(map);
let routeLayer=null,userPos=null,stores=[];
const $=id=>document.getElementById(id);

async function load(){
  const q=$('search').value.trim();
  const district=$('district').value;
  const url=new URL('/api/stores',location.origin);
  if(q)url.searchParams.set('q',q);
  if(district)url.searchParams.set('district',district);
  try{
    const r=await fetch(url);
    if(!r.ok) throw new Error('Backend tidak dapat diakses');
    stores=await r.json();
    render();
    $('loadStatus').textContent=`${stores.length} lokasi berhasil dimuat`;
  }catch(e){
    stores=[];
    render();
    $('loadStatus').textContent='Gagal mengambil data dari server.';
  }
}

function popup(s){
  const photo = s.photo_url
    ? `<img src="${esc(s.photo_url)}"
        alt="Foto ${esc(s.name)}"
        class="store-photo"
        onerror="this.style.display='none'">`
    : '';

  return `<div class="popup">
    ${photo}
    <h3>${esc(s.name)}</h3>
    <p><b>Alamat:</b> ${esc(s.address || 'Belum tersedia')}</p>
    <p><b>Jam:</b> ${esc(s.hours || 'Belum tersedia')}</p>
    <p><b>Produk:</b> ${esc(s.products || 'Belum tersedia')}</p>
    <p><b>Wilayah:</b> ${esc(s.district || 'Belum diverifikasi')}</p>
    <button onclick="routeTo(${s.latitude},${s.longitude})">
      Rute dari sini
    </button>
  </div>`;
}

function render(){
  markers.clearLayers();
  $('count').textContent=stores.length;
  let list='';
  const ordered=[...stores].sort((a,b)=>userPos?distanceKm(a,userPos)-distanceKm(b,userPos):0);
  ordered.forEach(s=>{
    const m=L.marker([Number(s.latitude),Number(s.longitude)]).bindPopup(popup(s));
    markers.addLayer(m);
    list+=`<div class="store">
      <h3>${esc(s.name)}</h3>
      <p>${esc(s.address||'Belum tersedia')}${userPos?` · ${distanceKm(s,userPos).toFixed(1)} km dari Anda`:''}</p>
      <button onclick="focusStore(${s.id})">Lihat di peta</button>
    </div>`;
  });
  $('list').innerHTML=list || '<div class="card">Data tidak ditemukan.</div>';
}

window.focusStore=id=>{
  const s=stores.find(x=>Number(x.id)===Number(id));
  if(!s)return;
  map.setView([Number(s.latitude),Number(s.longitude)],16);
  markers.eachLayer(m=>{
    const p=m.getLatLng();
    if(Math.abs(p.lat-Number(s.latitude))<1e-9 && Math.abs(p.lng-Number(s.longitude))<1e-9)m.openPopup();
  });
};

window.routeTo=async(lat,lng)=>{
  if(!userPos){
    $('routeInfo').textContent='Aktifkan Lokasi Saya terlebih dahulu.';
    return;
  }
  $('routeInfo').textContent='Menghitung rute...';
  const u=new URL('/api/route',location.origin);
  u.searchParams.set('fromLat',userPos.lat);
  u.searchParams.set('fromLng',userPos.lng);
  u.searchParams.set('toLat',lat);
  u.searchParams.set('toLng',lng);
  try{
    const r=await fetch(u).then(x=>x.json());
    if(!r.geometry)throw Error(r.message||'Rute tidak ditemukan');
    if(routeLayer)map.removeLayer(routeLayer);
    routeLayer=L.geoJSON(r.geometry).addTo(map);
    map.fitBounds(routeLayer.getBounds(),{padding:[30,30]});
    $('routeInfo').textContent=`Jarak ${(r.distance_m/1000).toFixed(2)} km • sekitar ${Math.round(r.duration_s/60)} menit`;
  }catch(e){$('routeInfo').textContent=e.message;}
};

$('gps').onclick=()=>{
  navigator.geolocation.getCurrentPosition(
    p=>{
      userPos={lat:p.coords.latitude,lng:p.coords.longitude};
      L.circleMarker([userPos.lat,userPos.lng],{radius:8}).addTo(map).bindPopup('Lokasi saya').openPopup();
      map.setView([userPos.lat,userPos.lng],14);
      render();
    },
    ()=>alert('Lokasi tidak dapat diakses. Pastikan izin lokasi aktif.')
  );
};
function distanceKm(store,point){
  const rad=x=>x*Math.PI/180,lat1=rad(Number(store.latitude)),lat2=rad(point.lat),dLat=lat2-lat1,dLng=rad(point.lng-Number(store.longitude));
  const a=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
$('search').oninput=load;
$('district').onchange=load;

function esc(v){
  return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
load();
