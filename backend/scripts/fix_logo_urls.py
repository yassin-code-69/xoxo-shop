"""Quick script to update payment method logo_url from .png to the correct file extensions."""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import update, text
from app.db.session import async_engine

async def fix_logo_urls():
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy.orm import sessionmaker
    
    async_session = sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Update bkash
        await session.execute(text(
            "UPDATE payment_methods SET logo_url = '/images/bkash.png' WHERE code = 'BKASH' AND (logo_url IS NULL OR logo_url = '')"
        ))
        # Update nagad
        await session.execute(text(
            "UPDATE payment_methods SET logo_url = '/images/nagad.png' WHERE code = 'NAGAD' AND (logo_url IS NULL OR logo_url = '')"
        ))
        # Update rocket
        await session.execute(text(
            "UPDATE payment_methods SET logo_url = '/images/rocket.png' WHERE code = 'ROCKET' AND (logo_url IS NULL OR logo_url = '')"
        ))
        
        # Check current values
        result = await session.execute(text("SELECT code, logo_url FROM payment_methods"))
        rows = result.fetchall()
        for row in rows:
            print(f"  {row[0]}: {row[1]}")
        
        await session.commit()
        print("\nDone! Logo URLs are set correctly.")

if __name__ == "__main__":
    asyncio.run(fix_logo_urls())
