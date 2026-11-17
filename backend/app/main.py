"""Simple inventory dashboard API with auditable stock movements (demo)."""
import csv
import io
import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from .database import Base,engine,get_db
from .models import Product,StockMovement

Base.metadata.create_all(bind=engine)
app=FastAPI(title='ERP Inventory & Reporting API',version='1.0.0')
app.add_middleware(CORSMiddleware,allow_origins=[os.getenv('FRONTEND_ORIGIN','http://localhost:3001')],allow_methods=['GET','POST'],allow_headers=['*'])

class ProductIn(BaseModel):
    sku:str=Field(min_length=2,max_length=50)
    name:str=Field(min_length=2,max_length=160)
    category:str=Field(min_length=2,max_length=80)
    price:Decimal=Field(ge=0)
    stock:int=Field(ge=0)
    reorder_level:int=Field(ge=0)

class AdjustIn(BaseModel):
    change:int=Field(ge=-100000,le=100000)
    reason:str=Field(min_length=3,max_length=100)

def format_product(p:Product)->dict:
    return {'id':p.id,'sku':p.sku,'name':p.name,'category':p.category,'price':float(p.price),
            'stock':p.stock,'reorder_level':p.reorder_level,'low_stock':p.stock<=p.reorder_level,
            'value':round(float(p.price)*p.stock,2)}

@app.get('/health')
def health():return {'status':'ok'}

@app.get('/api/kpis')
def kpis(db:Session=Depends(get_db)):
    products=db.scalars(select(Product)).all()
    return {'total_skus':len(products),'total_units':sum(p.stock for p in products),
            'low_stock':sum(1 for p in products if p.stock<=p.reorder_level),
            'out_of_stock':sum(1 for p in products if p.stock==0),
            'inventory_value':round(sum(float(p.price)*p.stock for p in products),2)}

@app.get('/api/products')
def list_products(search:str='',category:str='',low_stock:bool=False,page:int=Query(1,ge=1),page_size:int=Query(50,ge=1,le=200),db:Session=Depends(get_db)):
    query=select(Product)
    if search:
        term=f'%{search[:80]}%';query=query.where(or_(Product.name.ilike(term),Product.sku.ilike(term)))
    if category:query=query.where(Product.category==category)
    if low_stock:query=query.where(Product.stock<=Product.reorder_level)
    entries=db.scalars(query.order_by(Product.name)).all()
    return {'items':[format_product(p) for p in entries[(page-1)*page_size:page*page_size]],'total':len(entries),'page':page}

@app.get('/api/categories')
def categories(db:Session=Depends(get_db)):
    return list(db.scalars(select(Product.category).distinct().order_by(Product.category)))

@app.get('/api/movements')
def movements(limit:int=Query(12,ge=1,le=100),db:Session=Depends(get_db)):
    rows=db.execute(select(StockMovement,Product.sku,Product.name).join(Product,StockMovement.product_id==Product.id)
                    .order_by(StockMovement.created_at.desc(),StockMovement.id.desc()).limit(limit)).all()
    return [{'id':m.id,'sku':sku,'name':name,'change':m.change,'reason':m.reason,'date':m.created_at.isoformat()} for m,sku,name in rows]

@app.post('/api/products',status_code=201)
def create_product(data:ProductIn,db:Session=Depends(get_db)):
    if db.scalar(select(Product.id).where(Product.sku==data.sku.upper())):
        raise HTTPException(409,'SKU already exists')
    product=Product(sku=data.sku.upper(),name=data.name,category=data.category,price=data.price,stock=data.stock,reorder_level=data.reorder_level)
    db.add(product);db.flush()
    if data.stock:db.add(StockMovement(product_id=product.id,change=data.stock,reason='Initial stock'))
    db.commit();db.refresh(product);return format_product(product)

@app.post('/api/products/{product_id}/adjust')
def adjust_stock(product_id:int,data:AdjustIn,db:Session=Depends(get_db)):
    # SELECT FOR UPDATE protects against concurrent negative-stock adjustments on PostgreSQL.
    product=db.scalar(select(Product).where(Product.id==product_id).with_for_update())
    if not product:raise HTTPException(404,'Product not found')
    if product.stock+data.change<0:raise HTTPException(400,'Insufficient stock')
    if data.change==0:raise HTTPException(400,'Change cannot be zero')
    product.stock+=data.change
    db.add(StockMovement(product_id=product.id,change=data.change,reason=data.reason))
    db.commit();db.refresh(product);return format_product(product)

@app.get('/api/reports/inventory.csv')
def export_inventory(db:Session=Depends(get_db)):
    stream=io.StringIO();w=csv.DictWriter(stream,fieldnames=['sku','name','category','price','stock','reorder_level','low_stock','value']);w.writeheader()
    for p in db.scalars(select(Product).order_by(Product.name)):w.writerow({k:v for k,v in format_product(p).items() if k!='id'})
    return StreamingResponse(iter([stream.getvalue()]),media_type='text/csv',headers={'Content-Disposition':'attachment; filename="inventory-report.csv"'})
