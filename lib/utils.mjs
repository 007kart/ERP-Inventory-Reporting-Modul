export function validateItem(item) {
 if(!String(item?.name||'').trim()||String(item?.name||'').length>120)return 'Product name is required (up to 120 characters).';
 if(!/^[a-z0-9][a-z0-9-]{2,35}$/i.test(String(item?.sku||'')))return 'SKU must use 3–36 letters, digits or hyphens.';
 if(!String(item?.category||'').trim()||String(item?.category||'').length>70)return 'Select a category.';
 if(!Number.isSafeInteger(Number(item?.initialStock))||Number(item.initialStock)<0||Number(item.initialStock)>100000)return 'Initial stock must be 0–100,000.';
 if(!Number.isSafeInteger(Number(item?.reorderLevel))||Number(item.reorderLevel)<0||Number(item.reorderLevel)>100000)return 'Reorder level must be 0–100,000.';
 if(!Number.isFinite(Number(item?.unitPrice))||Number(item.unitPrice)<0||Number(item.unitPrice)>10000000)return 'Unit price must be a valid nonnegative value.';
 return null;
}
export function validateAdjustment(body) {
 if(!Number.isSafeInteger(Number(body?.itemId))||Number(body.itemId)<1)return 'Select a valid item.';
 if(!['in','out'].includes(body?.type))return 'Adjustment type must be in or out.';
 if(!Number.isSafeInteger(Number(body?.quantity))||Number(body.quantity)<1||Number(body.quantity)>10000)return 'Quantity must be between 1 and 10,000.';
 if(String(body?.reason||'').trim().length>160)return 'Reason must be under 160 characters.';
 return null;
}
export function csvEscape(value){let s=value==null?'':String(value);if(/^[\s]*[=+@\-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function makeCsv(headers,rows){return [headers.map(csvEscape).join(','),...rows.map(r=>r.map(csvEscape).join(','))].join('\r\n')+'\r\n';}
