import test from 'node:test';import assert from 'node:assert/strict';
import {validateItem,validateAdjustment,makeCsv} from '../lib/utils.mjs';
test('item creation requires valid sku and integer stock',()=>{
 const item={sku:'AB-123',name:'Office chair',category:'Furniture',initialStock:4,reorderLevel:7,unitPrice:1199};
 assert.equal(validateItem(item),null);
 assert.match(validateItem({...item,sku:'!' }),/SKU/);
 assert.match(validateItem({...item,initialStock:-1}),/stock/i);
});
test('adjustment rejects malformed and negative operations',()=>{
 assert.equal(validateAdjustment({itemId:1,type:'in',quantity:3,reason:'Shipment'}),null);
 assert.match(validateAdjustment({itemId:1,type:'out',quantity:0}),/Quantity/);
 assert.match(validateAdjustment({itemId:1,type:'delete',quantity:5}),/type/);
});
test('CSV escapes spreadsheet formulas',()=>{
 assert.match(makeCsv(['Name'],[['=IMPORTDATA("evil")']]),/"'=IMPORTDATA/);
});
