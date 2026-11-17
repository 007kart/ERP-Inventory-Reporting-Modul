from datetime import datetime, timezone
from sqlalchemy import Integer, Numeric, String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

def utc_now():return datetime.now(timezone.utc)

class Product(Base):
    __tablename__='products'
    id:Mapped[int]=mapped_column(primary_key=True)
    sku:Mapped[str]=mapped_column(String(50),unique=True,index=True)
    name:Mapped[str]=mapped_column(String(160))
    category:Mapped[str]=mapped_column(String(80))
    price:Mapped[float]=mapped_column(Numeric(12,2))
    stock:Mapped[int]=mapped_column(Integer,default=0)
    reorder_level:Mapped[int]=mapped_column(Integer,default=5)
    updated_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=utc_now,onupdate=utc_now)
    movements:Mapped[list['StockMovement']]=relationship(back_populates='product',cascade='all,delete-orphan')

class StockMovement(Base):
    __tablename__='stock_movements'
    id:Mapped[int]=mapped_column(primary_key=True)
    product_id:Mapped[int]=mapped_column(ForeignKey('products.id'),index=True)
    change:Mapped[int]=mapped_column(Integer)
    reason:Mapped[str]=mapped_column(String(100))
    created_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=utc_now)
    product:Mapped[Product]=relationship(back_populates='movements')
