const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const OSRM_URL = process.env.OSRM_URL || 'https://router.project-osrm.org';

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'database.sqlite');
const FRONTEND_DIR = path.join(__dirname, '..', '..', 'frontend');
const storesSeed = require('./data');

app.use(cors());
app.use(express.json());
app.use(express.static(FRONTEND_DIR));

let db;

function saveDb(){
  fs.mkdirSync(DB_DIR,{recursive:true});
  fs.writeFileSync(DB_FILE,Buffer.from(db.export()));
}
function rows(sql,params=[]){
  const stmt=db.prepare(sql); stmt.bind(params); const out=[];
  while(stmt.step()) out.push(stmt.getAsObject()); stmt.free(); return out;
}
function run(sql,params=[]){
  const stmt=db.prepare(sql); stmt.run(params); stmt.free(); saveDb();
}
async function initDb(){
  const SQL=await initSqlJs({locateFile:file=>require.resolve(`sql.js/dist/${file}`)});
  db=fs.existsSync(DB_FILE)?new SQL.Database(fs.readFileSync(DB_FILE)):new SQL.Database();
  db.run(`CREATE TABLE IF NOT EXISTS admins(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS stores(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,address TEXT NOT NULL DEFAULT '',hours TEXT NOT NULL DEFAULT 'Belum tersedia',products TEXT NOT NULL DEFAULT 'Belum tersedia',photo_url TEXT NOT NULL DEFAULT '',district TEXT NOT NULL DEFAULT 'Belum diverifikasi',latitude REAL NOT NULL,longitude REAL NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS flavor_journals(id INTEGER PRIMARY KEY AUTOINCREMENT,profile_key TEXT NOT NULL,liquid_name TEXT NOT NULL,flavor TEXT NOT NULL DEFAULT '',rating INTEGER NOT NULL DEFAULT 0,notes TEXT NOT NULL DEFAULT '',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS maintenance_reminders(id INTEGER PRIMARY KEY AUTOINCREMENT,profile_key TEXT NOT NULL,component TEXT NOT NULL,changed_at TEXT NOT NULL,next_due TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '',created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
  const a=rows('SELECT id FROM admins WHERE username=?',['admin']);
  if(!a.length) run('INSERT INTO admins(username,password_hash) VALUES(?,?)',['admin',bcrypt.hashSync('admin123',10)]);
  const n=Number(rows('SELECT COUNT(*) n FROM stores')[0].n);
  if(n===0){
    const stmt=db.prepare('INSERT INTO stores(name,address,hours,products,photo_url,district,latitude,longitude) VALUES(?,?,?,?,?,?,?,?)');
    for(const [lat,lng,name,address] of storesSeed) stmt.run([name,address||'Belum tersedia','Belum tersedia','Belum tersedia','','Belum diverifikasi',lat,lng]);
    stmt.free(); saveDb();
  }
}
function auth(req,res,next){
  try{const h=req.headers.authorization||'';req.user=jwt.verify(h.replace('Bearer ',''),JWT_SECRET);next();}
  catch{res.status(401).json({message:'Token tidak valid'});}
}
app.get('/api/health',(req,res)=>res.json({ok:true,database:'SQLite',stores:Number(rows('SELECT COUNT(*) n FROM stores')[0].n)}));
app.post('/api/auth/login',(req,res)=>{
  const {username,password}=req.body||{};
  const a=rows('SELECT * FROM admins WHERE username=?',[username||''])[0];
  if(!a||!bcrypt.compareSync(password||'',a.password_hash)) return res.status(401).json({message:'Username atau password salah'});
  res.json({token:jwt.sign({id:a.id,username:a.username},JWT_SECRET,{expiresIn:'8h'})});
});
app.get('/api/stores',(req,res)=>{
  const q=String(req.query.q||'').toLowerCase().trim(), d=String(req.query.district||'').trim();
  let data=rows('SELECT id,name,address,hours,products,photo_url,district,latitude,longitude FROM stores ORDER BY id');
  if(q)data=data.filter(s=>String(s.name).toLowerCase().includes(q)||String(s.address).toLowerCase().includes(q));
  if(d)data=data.filter(s=>String(s.district)===d);
  res.json(data);
});
app.get('/api/stores/:id',(req,res)=>{
  const x=rows('SELECT * FROM stores WHERE id=?',[req.params.id])[0];
  x?res.json(x):res.status(404).json({message:'Data tidak ditemukan'});
});
app.get('/api/companion/journals',(req,res)=>{
  const key=String(req.query.profileKey||'').trim();
  if(!key)return res.status(400).json({message:'Profil diperlukan'});
  res.json(rows('SELECT * FROM flavor_journals WHERE profile_key=? ORDER BY id DESC',[key]));
});
app.post('/api/companion/journals',(req,res)=>{
  const b=req.body||{},key=String(b.profileKey||'').trim(),rating=Number(b.rating||0);
  if(!key||!String(b.liquidName||'').trim())return res.status(400).json({message:'Nama liquid wajib diisi'});
  if(!Number.isInteger(rating)||rating<0||rating>5)return res.status(400).json({message:'Rating harus antara 0 sampai 5'});
  run('INSERT INTO flavor_journals(profile_key,liquid_name,flavor,rating,notes) VALUES(?,?,?,?,?)',[key,String(b.liquidName).trim(),String(b.flavor||'').trim(),rating,String(b.notes||'').trim()]);
  res.status(201).json(rows('SELECT * FROM flavor_journals ORDER BY id DESC LIMIT 1')[0]);
});
app.delete('/api/companion/journals/:id',(req,res)=>{
  const key=String(req.query.profileKey||'').trim();
  if(!key)return res.status(400).json({message:'Profil diperlukan'});
  run('DELETE FROM flavor_journals WHERE id=? AND profile_key=?',[req.params.id,key]);res.json({message:'Jurnal dihapus'});
});
app.get('/api/companion/reminders',(req,res)=>{
  const key=String(req.query.profileKey||'').trim();
  if(!key)return res.status(400).json({message:'Profil diperlukan'});
  res.json(rows('SELECT * FROM maintenance_reminders WHERE profile_key=? ORDER BY next_due ASC',[key]));
});
app.post('/api/companion/reminders',(req,res)=>{
  const b=req.body||{},key=String(b.profileKey||'').trim();
  if(!key||!String(b.component||'').trim()||!String(b.changedAt||'').trim()||!String(b.nextDue||'').trim())return res.status(400).json({message:'Komponen dan tanggal wajib diisi'});
  run('INSERT INTO maintenance_reminders(profile_key,component,changed_at,next_due,notes) VALUES(?,?,?,?,?)',[key,String(b.component).trim(),String(b.changedAt),String(b.nextDue),String(b.notes||'').trim()]);
  res.status(201).json(rows('SELECT * FROM maintenance_reminders ORDER BY id DESC LIMIT 1')[0]);
});
app.delete('/api/companion/reminders/:id',(req,res)=>{
  const key=String(req.query.profileKey||'').trim();
  if(!key)return res.status(400).json({message:'Profil diperlukan'});
  run('DELETE FROM maintenance_reminders WHERE id=? AND profile_key=?',[req.params.id,key]);res.json({message:'Pengingat dihapus'});
});
app.post('/api/stores',auth,(req,res)=>{
  const b=req.body||{};
  if(!b.name||b.latitude==null||b.longitude==null)return res.status(400).json({message:'Nama, latitude, longitude wajib diisi'});
  if(b.latitude<-90||b.latitude>90||b.longitude<-180||b.longitude>180)return res.status(400).json({message:'Koordinat tidak valid'});
  run('INSERT INTO stores(name,address,hours,products,photo_url,district,latitude,longitude) VALUES(?,?,?,?,?,?,?,?)',
    [b.name,b.address||'',b.hours||'Belum tersedia',b.products||'Belum tersedia',b.photo_url||'',b.district||'Belum diverifikasi',Number(b.latitude),Number(b.longitude)]);
  res.status(201).json(rows('SELECT * FROM stores ORDER BY id DESC LIMIT 1')[0]);
});
app.put('/api/stores/:id',auth,(req,res)=>{
  const b=req.body||{};
  if(!rows('SELECT id FROM stores WHERE id=?',[req.params.id]).length)return res.status(404).json({message:'Data tidak ditemukan'});
  if(!b.name||b.latitude==null||b.longitude==null)return res.status(400).json({message:'Nama, latitude, longitude wajib diisi'});
  run('UPDATE stores SET name=?,address=?,hours=?,products=?,photo_url=?,district=?,latitude=?,longitude=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
    [b.name,b.address||'',b.hours||'Belum tersedia',b.products||'Belum tersedia',b.photo_url||'',b.district||'Belum diverifikasi',Number(b.latitude),Number(b.longitude),req.params.id]);
  res.json(rows('SELECT * FROM stores WHERE id=?',[req.params.id])[0]);
});
app.delete('/api/stores/:id',auth,(req,res)=>{
  if(!rows('SELECT id FROM stores WHERE id=?',[req.params.id]).length)return res.status(404).json({message:'Data tidak ditemukan'});
  run('DELETE FROM stores WHERE id=?',[req.params.id]);res.json({message:'Data dihapus'});
});
app.get('/api/route',async(req,res)=>{
  const {fromLat,fromLng,toLat,toLng}=req.query;
  if([fromLat,fromLng,toLat,toLng].some(v=>v==null))return res.status(400).json({message:'Koordinat asal dan tujuan wajib diisi'});
  try{
    const u=`${OSRM_URL}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const r=await fetch(u),data=await r.json();
    if(!data.routes?.length)return res.status(404).json({message:'Rute tidak ditemukan'});
    const rt=data.routes[0];res.json({distance_m:rt.distance,duration_s:rt.duration,geometry:rt.geometry,provider:'OSRM demo'});
  }catch{res.status(502).json({message:'Routing service tidak dapat dihubungi'});}
});
app.get('/admin',(req,res)=>res.sendFile(path.join(FRONTEND_DIR,'admin.html')));
app.get('/map',(req,res)=>res.sendFile(path.join(FRONTEND_DIR,'map.html')));
app.get('/care',(req,res)=>res.sendFile(path.join(FRONTEND_DIR,'companion.html')));
app.get('/companion',(req,res)=>res.redirect('/care'));
app.get('*',(req,res)=>res.sendFile(path.join(FRONTEND_DIR,'index.html')));

initDb().then(()=>{
  app.listen(PORT,()=>{console.log(`VComp - Vape Companion berjalan di http://localhost:${PORT}`);console.log(`Database: SQLite`);console.log(`Data toko: ${rows('SELECT COUNT(*) n FROM stores')[0].n} lokasi`);});
}).catch(err=>{console.error('Gagal menyiapkan database:',err);process.exit(1);});
process.on('SIGINT',()=>{if(db)saveDb();process.exit(0);});
process.on('SIGTERM',()=>{if(db)saveDb();process.exit(0);});
