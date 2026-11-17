import {NextResponse} from 'next/server';
import {getPool} from '../../../lib/db';
import {validateAdjustment} from '../../../lib/utils.mjs';
export const runtime='nodejs';
export async function POST(request){let data;try{data=await request.json()}catch{return NextResponse.json({error:'Invalid JSON.'},{status:400});}
 const error=validateAdjustment(data);if(error)return NextResponse.json({error},{status:400});
 const id=Number(data.itemId),quantity=Number(data.quantity),type=data.type,reason=String(data.reason||'').trim();
 const db=await getPool().connect();
 try{
  await db.query('BEGIN');
  const record=(await db.query('SELECT id,name,stock FROM inventory_items WHERE id=$1 FOR UPDATE',[id])).rows[0];
  if(!record){await db.query('ROLLBACK');return NextResponse.json({error:'Inventory item not found.'},{status:404});}
  const after=record.stock+(type==='in'?quantity:-quantity);
  if(after<0){await db.query('ROLLBACK');return NextResponse.json({error:`Insufficient stock. Only ${record.stock} units available.`},{status:409});}
  await db.query('UPDATE inventory_items SET stock=$1,updated_at=NOW() WHERE id=$2',[after,id]);
  await db.query(`INSERT INTO inventory_movements(item_id,action,quantity,previous_stock,resulting_stock,reason)
    VALUES($1,$2,$3,$4,$5,$6)`,[id,type,quantity,record.stock,after,reason]);
  await db.query('COMMIT');return NextResponse.json({itemId:id,previousStock:record.stock,newStock:after,message:'Inventory adjusted.'},{status:201});
 }catch(e){await db.query('ROLLBACK').catch(()=>{});console.error(e);return NextResponse.json({error:'Could not record adjustment.'},{status:503});}
 finally{db.release()}
}
