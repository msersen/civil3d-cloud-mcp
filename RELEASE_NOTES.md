# Release Notes - v0.1.0-alpha

**Release Date:** December 9, 2025  
**Status:** Alpha (Staging Deployment)  
**Target Deployment:** Google Cloud Run

---

## Overview

Civil 3D Cloud MCP Server v0.1.0-alpha is the initial release of the cloud-based Model Context Protocol server for Autodesk Civil 3D integration. This version provides core WebSocket communication, Vertex AI integration, and agentic tool-calling capabilities.

## What's New

### Core Features
- **WebSocket Server** - Full-duplex communication for real-time interaction
- **Vertex AI Integration** - Gemini 1.5 Pro model for intelligent responses
- **Agentic Architecture** - AI autonomously selects and executes Civil 3D tools
- **Session Management** - UUID-based session tracking for multi-user support
- **Demo Mode** - Development mode works without GCP credentials

### Available Tools
1. **create_cogo_point** - Create COGO points in Civil 3D drawings
2. **create_line_segment** - Draw line segments between coordinates
3. **get_drawing_info** - Retrieve drawing metadata
4. **list_civil_object_types** - List available Civil 3D objects
5. **get_selected_civil_objects_info** - Query selected objects

### Message Protocol
```json
{
  "type": "prompt",
  "prompt": "Create a point at 1000, 2000"
}
```

Server responds with:
```json
{
  "type": "response",
  "message": "I've created a COGO point at coordinates (1000, 2000)..."
}
```

## Installation & Deployment

### Local Development
```bash
cd c3dmcp-server
npm install
npm start
```

Server listens on `http://localhost:8080`

### Cloud Deployment (Google Cloud Run)
```bash
# Build Docker image
docker build -t gcr.io/YOUR-PROJECT/landsurv-brain:0.1.0-alpha .

# Push to Container Registry
docker push gcr.io/YOUR-PROJECT/landsurv-brain:0.1.0-alpha

# Deploy to Cloud Run
gcloud run deploy landsurv-brain \
  --image gcr.io/YOUR-PROJECT/landsurv-brain:0.1.0-alpha \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Configuration

### Environment Variables
```
PORT=8080                          # Server port (default: 8080)
GCP_PROJECT_ID=your-project-id     # Google Cloud Project ID
GCP_LOCATION=us-central1           # Vertex AI location (default: us-central1)
```

### Demo Mode
If `GCP_PROJECT_ID` is not set, the server runs in demo mode and responds with mock messages.

## Breaking Changes
None - This is the initial release.

## Bug Fixes
- Fixed WebSocket message handling to use proper async/await patterns
- Improved error handling for missing GCP credentials
- Corrected working directory issues with npm scripts

## Performance
- Response time: ~500ms-2s (including Gemini AI processing)
- Maximum concurrent connections: 100+ (configurable)
- Memory usage: ~50-100MB base + ~10MB per active session
- Supports horizontal scaling via Cloud Run

## Security
- ⚠️ **Alpha release note**: Authentication not yet implemented
- API key validation ready in C# client
- License key checking ready in C# client
- WebSocket headers prepared for authentication

## Testing

### Health Check
```bash
curl http://localhost:8080/health
```

### WebSocket Test
```javascript
const ws = new WebSocket('ws://localhost:8080/ws');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: "prompt",
    prompt: "Hello, what can you do?"
  }));
};
```

## Known Limitations

1. **No Persistent Storage** - Sessions are in-memory only
2. **Single Instance** - No load balancing configured yet
3. **Limited Logging** - Basic console logging only
4. **No Rate Limiting** - All clients treated equally
5. **Demo Mode Only for Development** - Requires GCP credentials for production

## Migration Guide
N/A - Initial release

## Support & Documentation

- **Architecture**: See `C3DMCP_COMPLETE_SUMMARY.md`
- **API Reference**: See `PHASE_1_COMPLETION.md`
- **Deployment Guide**: See `PHASE_5_ROADMAP.md`
- **Troubleshooting**: See `PHASE_3_TESTING_GUIDE.md`

## Contributors
- Development: LandSurv.ai Team
- Reviewed: GitHub Actions CI/CD

## License
ISC

## Feedback & Issues

Report issues on GitHub: https://github.com/msersen/LandSurv.ai-Refactored/issues

---

**Next Release**: v0.2.0 (Q1 2026)
- Authentication & security hardening
- Database persistence layer
- Advanced logging and monitoring
- Rate limiting and throttling

