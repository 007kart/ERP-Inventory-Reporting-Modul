import pg from 'pg';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const url=process.env.DATABASE_URL;
if(!url){console.error('Set DATABASE_URL first (see .env.example)');process.exit(1);}
const db=new pg.Client({connectionString:url,ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:true}:false});
const folder=path.dirname(fileURLToPath(import.meta.url));
const suppliers=[['Northstar Supplies','hello@northstar.example','Ahmedabad'],['Meridian Wholesale','hello@meridian.example','Mumbai'],['Atlas Distribution','hello@atlas.example','Surat'],['Bright Goods Co.','hello@brightgoods.example','Pune'],['Summit Logistics','hello@summit.example','Delhi']];
const items=[
['TEC-101','Wireless Keyboard','Electronics',3599,38,12,1],['TEC-102','Ergonomic Mouse','Electronics',1999,8,15,1],['TEC-103','USB-C Adapter Kit','Electronics',1499,92,20,2],['TEC-104','27-inch Monitor','Electronics',16999,13,10,2],
['OFF-201','A5 Grid Notebook','Office supplies',499,67,20,3],['OFF-202','Gel Pen Set','Office supplies',349,9,18,3],['OFF-203','Desk Organizer','Office supplies',899,56,12,4],['OFF-204','Ergonomic Chair','Furniture',14999,5,8,4],
['FUR-301','Adjustable Desk','Furniture',22500,11,5,5],['FUR-302','Storage Cabinet','Furniture',11999,0,6,5],['PAC-401','Shipping Cartons 25pc','Packaging',1699,130,35,2],['PAC-402','Packaging Tape 12pc','Packaging',599,14,20,2],
['LIG-501','LED Panel Light','Lighting',3499,49,12,1],['LIG-502','Focus Task Lamp','Lighting',2399,6,9,1],['LIG-503','Ambient Light Strip','Lighting',1299,61,15,3],['SAF-601','First Aid Kit','Safety',1999,25,8,4],
['SAF-602','Safety Goggles','Safety',499,4,10,5],['TEC-105','Laptop Docking Station','Electronics',8499,21,10,1],['TEC-106','Wireless Charger','Electronics',2799,7,12,2],['OFF-205','Felt Desk Mat','Office supplies',1299,43,12,4]
];
try{
 await db.connect();
 await db.query(await fs.readFile(path.join(folder,'../db/schema.sql'),'utf8'));
 const count=(await db.query('SELECT COUNT(*)::int AS n FROM inventory_items')).rows[0].n;
 if(count){console.log('Tables ready. Seed skipped; existing inventory preserved.');process.exit(0);}
 await db.query('BEGIN');
 for(const s of suppliers)await db.query('INSERT INTO suppliers(name,contact_email,city) VALUES($1,$2,$3) ON CONFLICT(name) DO NOTHING',s);
 const refs=(await db.query('SELECT id FROM suppliers ORDER BY id')).rows;
 for(const [sku,name,category,unitPrice,stock,reorderLevel,supplierNum] of items){
  await db.query('INSERT INTO inventory_items(sku,name,category,unit_price,stock,reorder_level,supplier_id) VALUES($1,$2,$3,$4,$5,$6,$7)',[sku,name,category,unitPrice,stock,reorderLevel,refs[supplierNum-1].id]);
 }
 const ids=(await db.query('SELECT id,stock FROM inventory_items ORDER BY id')).rows;
 for(let i=0;i<35;i++){
  const row=ids[i%ids.length],type=i%4===0?'out':'in';
  const quantity=1+(i%7),after=row.stock;
  const before=type==='in'?Math.max(0,after-quantity):after+quantity;
  await db.query(`INSERT INTO inventory_movements(item_id,action,quantity,previous_stock,resulting_stock,reason,created_at)
    VALUES($1,$2,$3,$4,$5,$6,NOW()-($7::int*INTERVAL '1 day'))`,[row.id,type,quantity,before,after,'Sample movement history',i]);
 }
 await db.query('COMMIT');console.log('Seeded 20 synthetic items, 5 suppliers and example history.');
}catch(e){await db.query('ROLLBACK').catch(()=>{});console.error(e);process.exitCode=1;}finally{await db.end()}
