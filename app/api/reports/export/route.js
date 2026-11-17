import {NextResponse} from 'next/server';
import {query} from '../../../../lib/db';
import {makeCsv} from '../../../../lib/utils.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{
 const result=await query(`SELECT i.sku,i.name,i.category,i.stock,i.reorder_level,
   i.unit_price,(i.stock*i.unit_price) AS stock_value,COALESCE(s.name,'') AS supplier,
   CASE WHEN i.stock=0 THEN 'Out of stock' WHEN i.stock<=i.reorder_level THEN 'Low stock' ELSE 'Healthy' END AS status
   FROM inventory_items i LEFT JOIN suppliers s ON s.id=i.supplier_id ORDER BY i.category,i.name LIMIT 20000`);
 const csv=makeCsv(['SKU','Item','Category','Stock','Reorder Level','Unit Price INR','Inventory Value INR','Supplier','Status'],result.rows.map(r=>[r.sku,r.name,r.category,r.stock,r.reorder_level,r.unit_price,r.stock_value,r.supplier,r.status]));
 return new NextResponse(csv,{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':'attachment; filename="stockpilot-inventory.csv"','cache-control':'no-store'}});
}catch(e){console.error(e);return NextResponse.json({error:'Export unavailable.'},{status:503});}}
