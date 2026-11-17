from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from app.database import Base,get_db
from app.main import app

engine=create_engine('sqlite://',connect_args={'check_same_thread':False},poolclass=StaticPool)
Base.metadata.create_all(engine)
Session=sessionmaker(bind=engine)
def override():
    with Session() as s:yield s
app.dependency_overrides[get_db]=override
client=TestClient(app)

def test_kpis_empty():
    assert client.get('/health').status_code==200
    assert client.get('/api/kpis').json()['total_skus']==0

def test_inventory_lifecycle():
    payload={'sku':'aa-101','name':'Demo Widget','category':'Demo','price':'120.00','stock':4,'reorder_level':5}
    r=client.post('/api/products',json=payload);assert r.status_code==201,r.text
    item=r.json();assert item['low_stock'] is True
    assert client.post('/api/products',json=payload).status_code==409
    assert client.get('/api/kpis').json()['low_stock']==1
    assert client.get('/api/products?low_stock=true').json()['total']==1
    bad=client.post(f"/api/products/{item['id']}/adjust",json={'change':-5,'reason':'Sale'})
    assert bad.status_code==400
    good=client.post(f"/api/products/{item['id']}/adjust",json={'change':10,'reason':'Restock'})
    assert good.status_code==200
    assert good.json()['stock']==14 and good.json()['low_stock'] is False
    assert len(client.get('/api/movements').json())==2
    assert 'Demo Widget' in client.get('/api/reports/inventory.csv').text

def test_invalid_data():
    assert client.post('/api/products',json={'sku':'a','name':'x','category':'b','price':-1,'stock':-1,'reorder_level':-1}).status_code==422
    assert client.post('/api/products/999/adjust',json={'change':1,'reason':'Restock'}).status_code==404
