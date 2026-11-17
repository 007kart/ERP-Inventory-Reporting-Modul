import {NextResponse} from 'next/server';
import {query} from '../../../lib/db';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{
 const [overview,categories,activity,lowStock,trend,suppliers]=await Promise.all([
  query(`SELECT COUNT(*)::int AS total_items,COALESCE(SUM(stock),0)::int AS total_units,
    COALESCE(SUM(unit_price*stock),0) AS inventory_value,
    COUNT(*) FILTER(WHERE stock<=reorder_level)::int AS low_stock,
    COUNT(*) FILTER(WHERE stock=0)::int AS out_of_stock FROM inventory_items`),
  query(`SELECT category,COUNT(*)::int AS items,COALESCE(SUM(stock),0)::int AS units,
    COALESCE(SUM(unit_price*stock),0) AS value FROM inventory_items GROUP BY category ORDER BY value DESC`),
  query(`SELECT m.id,m.action,m.quantity,m.previous_stock,m.resulting_stock,m.reason,m.created_at,
    i.name,i.sku FROM inventory_movements m JOIN inventory_items i ON i.id=m.item_id
    ORDER BY m.created_at DESC,m.id DESC LIMIT 9`),
  query(`SELECT id,sku,name,category,stock,reorder_level FROM inventory_items
    WHERE stock<=reorder_level ORDER BY stock ASC LIMIT 8`),
  query(`SELECT d.day::date::text AS date,TO_CHAR(d.day,'Mon DD') AS label,
      COUNT(m.id) FILTER(WHERE m.action='in')::int AS incoming,
      COUNT(m.id) FILTER(WHERE m.action='out')::int AS outgoing
    FROM generate_series(CURRENT_DATE-13,CURRENT_DATE,INTERVAL '1 day') d(day)
    LEFT JOIN inventory_movements m ON m.created_at::date=d.day::date
    GROUP BY d.day ORDER BY d.day`),
  query('SELECT COUNT(*)::int AS count FROM suppliers')
 ]);
 return NextResponse.json({metrics:overview.rows[0],categories:categories.rows,activity:activity.rows,
   lowStock:lowStock.rows,trend:trend.rows,suppliers:suppliers.rows[0].count});
}catch(e){console.error(e);return NextResponse.json({error:'Could not load inventory analytics. Check DATABASE_URL and run npm run db:setup.'},{status:503});}}
