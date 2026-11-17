import {NextResponse} from 'next/server';
import {getPool,query} from '../../../lib/db';
import {validateItem} from '../../../lib/utils.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request){
 const params=new URL(request.url).searchParams;
 const search=String(params.get('search')||'').slice(0,100).trim();
 const category=String(params.get('category')||'all').slice(0,70);
 const lowOnly=params.get('low')==='true';
 const page=Math.max(1,Math.min(500,Number.parseInt(params.get('page'),10)||1)),limit=8;
 const conditions=`WHERE ($1::text='' OR i.name ILIKE '%'||$1||'%' OR i.sku ILIKE '%'||$1||'%')
      AND ($2::text='all' OR i.category=$2) AND (NOT $3::boolean OR i.stock<=i.reorder_level)`;
 try{
  const [count,rows]=await Promise.all([
   query(`SELECT COUNT(*)::int AS count FROM inventory_items i ${conditions}`,[search,category,lowOnly]),
   query(`SELECT i.id,i.sku,i.name,i.category,i.unit_price,i.stock,i.reorder_level,i.updated_at,
     COALESCE(s.name,'—') AS supplier_name FROM inventory_items i LEFT JOIN suppliers s ON s.id=i.supplier_id
     ${conditions} ORDER BY i.name LIMIT $4 OFFSET $5`,[search,category,lowOnly,limit,(page-1)*limit])
  ]);
  return NextResponse.json({items:rows.rows,total:count.rows[0].count,page,pages:Math.max(1,Math.ceil(count.rows[0].count/limit))});
 }catch(e){console.error(e);return NextResponse.json({error:'Could not retrieve inventory.'},{status:503});}
}
export async function POST(request){
 let data;try{data=await request.json()}catch{return NextResponse.json({error:'Invalid JSON.'},{status:400});}
 const validation=validateItem(data);if(validation)return NextResponse.json({error:validation},{status:400});
 const supplierId=data.supplierId?Number(data.supplierId):null;
 if(supplierId!==null&&(!Number.isInteger(supplierId)||supplierId<1))return NextResponse.json({error:'Invalid supplier.'},{status:400});
 const db=await getPool().connect();
 try{await db.query('BEGIN');
  const r=await db.query(`INSERT INTO inventory_items(sku,name,category,unit_price,stock,reorder_level,supplier_id)
   VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,[data.sku.trim().toUpperCase(),data.name.trim(),data.category.trim(),Number(data.unitPrice),Number(data.initialStock),Number(data.reorderLevel),supplierId]);
  if(Number(data.initialStock)>0)await db.query(`INSERT INTO inventory_movements(item_id,action,quantity,previous_stock,resulting_stock,reason)
    VALUES($1,'in',$2,0,$2,'Initial stock')`,[r.rows[0].id,Number(data.initialStock)]);
  await db.query('COMMIT');return NextResponse.json({id:r.rows[0].id,message:'Item created.'},{status:201});
 }catch(e){await db.query('ROLLBACK').catch(()=>{});if(e.code==='23505')return NextResponse.json({error:'SKU already exists.'},{status:409});if(e.code==='23503')return NextResponse.json({error:'Supplier not found.'},{status:400});console.error(e);return NextResponse.json({error:'Could not create item.'},{status:503});}finally{db.release()}
}
