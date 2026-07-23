# AlgoWeb API Specification

## REST V1 Endpoints
- `GET /health` - Service health status
- `GET /api/v1/status` - V1 Router readiness check
- `POST /api/v1/auth/login` - Bearer token authentication
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/strategies` - List active strategy configurations
- `POST /api/v1/backtest/run` - Trigger asynchronous backtest job

## WebSocket Streams
- `ws://backend/ws` - Real-time market tick feeds and trade execution updates
