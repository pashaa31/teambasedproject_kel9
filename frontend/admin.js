const API='/api';
const $=id=>document.getElementById(id);
let token=localStorage.getItem('adminToken')||'';
let allStores=[];

function setLoggedIn(on){
  $('loginBox').hidden=on;
  $('dashboard').hidden=!on;
}
async function login(){
  $('loginMsg').textContent='Memproses...';
  const r=await fetch(API+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({username:$('username').value,password:$('password').value})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok){$('loginMsg').textContent=data.message||'Login gagal';return;}
  token=data.token; localStorage.setItem('adminToken',token); setLoggedIn(true); loadStores();
}
async function loadStores(){
  const r=await fetch(API+'/stores');
  allStores=await r.json();
  $('total').textContent=`${allStores.length} data`;
  $('tbody').innerHTML=allStores.map(s=>`<tr>
    <td>${s.id}</td><td>${esc(s.name)}</td><td>${esc(s.address||'-')}</td>
    <td>${Number(s.latitude).toFixed(6)}, ${Number(s.longitude).toFixed(6)}</td>
    <td><button class="small" onclick="editStore(${s.id})">Edit</button>
        <button class="small danger" onclick="deleteStore(${s.id})">Hapus</button></td>
  </tr>`).join('');
}
window.editStore=id=>{
  const s=allStores.find(x=>Number(x.id)===Number(id)); if(!s)return;
  $('storeId').value=s.id;$('name').value=s.name;$('address').value=s.address||'';
  $('latitude').value=s.latitude;$('longitude').value=s.longitude;$('hours').value=s.hours||'Belum tersedia';
  $('products').value=s.products||'Belum tersedia';$('district').value=s.district||'Belum diverifikasi';
  $('photo_url').value=s.photo_url||'';$('formTitle').textContent='Edit Lokasi';
  $('cancelEdit').hidden=false;window.scrollTo({top:0,behavior:'smooth'});
};
async function deleteStore(id){
  if(!confirm('Hapus data lokasi ini?'))return;
  const r=await fetch(API+'/stores/'+id,{method:'DELETE',headers:{Authorization:'Bearer '+token}});
  if(r.status===401){logout();return;}
  if(!r.ok){alert('Gagal menghapus data');return;}
  loadStores();
}
async function save(e){
  e.preventDefault();
  const id=$('storeId').value;
  const body={name:$('name').value,address:$('address').value,latitude:Number($('latitude').value),
    longitude:Number($('longitude').value),hours:$('hours').value,products:$('products').value,
    district:$('district').value,photo_url:$('photo_url').value};
  const r=await fetch(API+'/stores'+(id?'/'+id:''),{method:id?'PUT':'POST',
    headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});
  const data=await r.json().catch(()=>({}));
  if(r.status===401){logout();return;}
  $('formMsg').textContent=r.ok?'Data berhasil disimpan.':(data.message||'Gagal menyimpan data');
  if(r.ok){resetForm();loadStores();}
}
function resetForm(){
  $('storeForm').reset();$('storeId').value='';$('hours').value='Belum tersedia';
  $('products').value='Belum tersedia';$('district').value='Belum diverifikasi';
  $('formTitle').textContent='Tambah Lokasi';$('cancelEdit').hidden=true;
}
function logout(){token='';localStorage.removeItem('adminToken');setLoggedIn(false);}
$('loginBtn').onclick=login;
$('logoutBtn').onclick=logout;
$('storeForm').onsubmit=save;
$('cancelEdit').onclick=resetForm;
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
setLoggedIn(false);
if(token){fetch(API+'/health').then(r=>{if(r.ok){setLoggedIn(true);loadStores();}else logout();}).catch(()=>logout());}
