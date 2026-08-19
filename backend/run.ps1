$ErrorActionPreference = "Stop"

$DIR = $PSScriptRoot
Set-Location $DIR

# Run database migrations / seed if needed
& "$DIR\.venv\Scripts\python.exe" -c "import asyncio; from app.db.init_db import init_db; asyncio.run(init_db())"

Write-Host "🚀 Starting XoXo Shop Backend on http://localhost:8000 (Docs: http://localhost:8000/docs)..."
& "$DIR\.venv\Scripts\uvicorn.exe" app.main:app --host 0.0.0.0 --port 8000 --reload
