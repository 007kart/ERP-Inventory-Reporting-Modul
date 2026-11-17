"""Synthetic products for a reproducible demo; no real enterprise/client data."""
from sqlalchemy import select,func
from .database import Base,engine,SessionLocal
from .models import Product,StockMovement

CATALOG=[
 ('ELC-1001','Wireless Keyboard','Electronics',2999,73,15),
 ('ELC-1002','Bluetooth Mouse','Electronics',1199,7,15),
 ('ELC-1003','USB-C Dock','Electronics',4299,22,12),
 ('ELC-1004','24-inch Monitor','Electronics',10999,3,6),
 ('ELC-1005','Laptop Stand','Electronics',1499,48,8),
 ('OFF-2001','A4 Paper Carton','Office Supplies',799,125,25),
 ('OFF-2002','Black Ink Pack','Office Supplies',1899,8,15),
 ('OFF-2003','Notebook Set','Office Supplies',249,0,20),
 ('OFF-2004','Whiteboard Markers','Office Supplies',399,19,20),
 ('OFF-2005','Desk Organiser','Office Supplies',649,39,10),
 ('FUR-3001','Ergonomic Chair','Furniture',7499,11,6),
 ('FUR-3002','Height Adjustable Desk','Furniture',18999,5,4),
 ('FUR-3003','Drawer Unit','Furniture',4999,9,10),
 ('FUR-3004','Visitor Chair','Furniture',3899,23,6),
 ('FUR-3005','Shelving Rack','Furniture',5999,2,5),
 ('ACC-4001','HDMI Cable','Accessories',449,89,25),
 ('ACC-4002','USB Drive 64GB','Accessories',699,31,15),
 ('ACC-4003','Ethernet Cable','Accessories',299,54,20),
 ('ACC-4004','Webcam Cover','Accessories',149,6,10),
 ('ACC-4005','Cable Organizer','Accessories',349,27,12),
]
def seed():
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if db.scalar(select(func.count()).select_from(Product)):
            print('Seed already exists');return
        for sku,name,category,price,stock,level in CATALOG:
            p=Product(sku=sku,name=name,category=category,price=price,stock=stock,reorder_level=level)
            db.add(p);db.flush()
            if stock:db.add(StockMovement(product_id=p.id,change=stock,reason='Demo opening balance'))
        db.commit();print('Seeded 20 synthetic inventory products')
if __name__=='__main__':seed()
