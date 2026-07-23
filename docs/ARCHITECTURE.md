# AlgoWeb Architecture Specification

## Overview
AlgoWeb is an enterprise-grade, high-frequency, multi-asset algorithmic trading monorepo designed with microservice principles, asynchronous I/O, strict layer isolation, and cloud portability.

## Layers
1. **Frontend**: Next.js 15 (App Router, Server Components, Zustand, TanStack Query)
2. **Backend Gateway**: FastAPI (Async Python, Pydantic v2, Motor MongoDB Driver)
3. **Task & Execution Engine**: Celery + Redis + Vectorized Python Workers
4. **Data Persistence**: MongoDB Atlas (Documents/Logs) & PostgreSQL / SQLAlchemy (Relational)
