# Changelog

All notable changes to the Civil 3D Cloud MCP Server will be documented in this file.

## [0.1.0-alpha] - 2025-12-09

### Added
- ✅ Initial WebSocket server implementation with Express.js
- ✅ Google Vertex AI Gemini Pro integration
- ✅ Agentic tool-calling architecture
- ✅ Session management with UUID tracking
- ✅ Health check endpoint (`/health`)
- ✅ Demo mode for development without GCP credentials
- ✅ Error handling for Vertex AI initialization
- ✅ npm start script for easy server startup
- ✅ Tool definitions for Civil 3D interaction:
  - `create_cogo_point` - Create survey points
  - `create_line_segment` - Draw line segments
  - `get_drawing_info` - Retrieve drawing information
  - `list_civil_object_types` - List available Civil 3D objects
  - `get_selected_civil_objects_info` - Get selected object properties
- ✅ WebSocket message routing (prompt, result, response, error)
- ✅ Tool result pending promise handling

### Fixed
- 🔧 WebSocket message loop - replaced invalid onmessage pattern with pending results map
- 🔧 Vertex AI initialization error handling for missing GCP credentials
- 🔧 Working directory issues with npm start script

### Changed
- 📝 Updated version to 0.1.0-alpha for staging deployment

### Technical Details
- **Framework**: Express.js + WebSocket (ws)
- **Language**: TypeScript
- **AI Model**: Google Vertex AI Gemini 1.5 Pro
- **Deployment**: Ready for Google Cloud Run
- **Port**: 8080 (configurable via environment variables)
- **Node.js**: v18+ required

### Known Issues
- None at this time

### Deployment Status
- ✅ Local development ready
- ⏳ Google Cloud Run deployment pending
- ⏳ Civil 3D plugin integration testing pending (awaiting license)

### Next Steps
1. Deploy to Google Cloud Run (staging)
2. Implement remaining interface integrations
3. Add authentication middleware
4. Create comprehensive API documentation
5. Set up monitoring and logging
6. Local integration testing with Civil 3D plugin

---

## Version History

### Roadmap
- **0.2.0**: Authentication & Security
  - API key validation
  - License key management
  - Rate limiting
  - Logging & monitoring

- **0.3.0**: Advanced Features
  - Multi-tenant support
  - Database persistence
  - Caching layer
  - Advanced error recovery

- **1.0.0**: Production Release
  - Full test coverage
  - Performance optimization
  - Comprehensive documentation
  - Enterprise support features

