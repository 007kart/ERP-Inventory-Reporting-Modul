import {NextResponse} from 'next/server';import {query} from '../../../lib/db';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{
 const result=await query('SELECT id,name,city FROM suppliers ORDER BY name');return NextResponse.json({suppliers:result.rows});
}catch(e){console.error(e);return NextResponse.json({error:'Suppliers unavailable.'},{status:503});}}
