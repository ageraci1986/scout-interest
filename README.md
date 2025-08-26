# Scout Interest - Meta Audience Analysis Tool

A comprehensive web application for analyzing Meta (Facebook Ads) audience size for postal code lists crossed with specific interest criteria. This tool optimizes advertising campaigns by providing precise geolocated audience data.

## 🚀 Features

- **File Upload & Validation**: Support for Excel (.xlsx, .xls) and CSV files with automatic postal code validation
- **Interest Targeting**: Meta interest search with autocomplete and real-time audience preview
- **Batch Processing**: Optimized queue system with rate limiting and intelligent retry mechanisms
- **Real-time Monitoring**: Live dashboard with progress tracking and detailed analytics
- **Advanced Analytics**: Interactive data tables, heatmaps, and correlation graphs
- **Export Capabilities**: Multiple export formats (Excel, CSV, JSON, PDF) with customizable templates

## 🏗️ Architecture

### Frontend
- **React.js** with TypeScript
- **Tailwind CSS** for modern UI
- **Zustand** for state management
- **React Dropzone** for file uploads
- **React Table** for interactive data tables
- **Recharts** for data visualization
- **Socket.io Client** for real-time updates

### Backend
- **Node.js** with Express.js
- **PostgreSQL** for data persistence
- **Redis** for caching and session management
- **Bull/BullMQ** for job queue management
- **Multer** for file processing
- **Socket.io** for real-time communication

### APIs
- **Meta Marketing API** (Graph API)
- **OAuth 2.0** authentication

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Meta Developer Account

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd scout-Interest
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

4. **Database Setup**
   ```bash
   # Create database
   createdb scout_interest_db
   
   # Run migrations
   cd backend
   npm run migrate
   ```

5. **Start Development Servers**
   ```bash
   # Backend (from backend directory)
   npm run dev
   
   # Frontend (from frontend directory)
   npm start
   ```

## 🔧 Configuration

### Meta API Setup
1. Create a Meta Developer account
2. Create a Facebook App
3. Configure OAuth 2.0 settings
4. Add required permissions:
   - `ads_management`
   - `ads_read`
   - `business_management`

### Environment Variables

**Backend (.env)**
```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/scout_interest_db

# Redis
REDIS_URL=redis://localhost:6379

# Meta API
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_ACCESS_TOKEN=your_meta_access_token

# JWT
JWT_SECRET=your_jwt_secret

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SOCKET_URL=http://localhost:3001
```

## 📊 Usage

1. **Upload Postal Codes**: Drag and drop Excel/CSV files containing postal codes
2. **Configure Targeting**: Search and select Meta interests, set demographic parameters
3. **Start Analysis**: Launch batch processing with real-time monitoring
4. **Review Results**: Analyze audience data with interactive visualizations
5. **Export Data**: Download results in your preferred format

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 📈 Performance

- **Rate Limiting**: Respects Meta API limits (200 calls/hour default)
- **Caching**: Redis-based caching for frequent API responses
- **Optimization**: Intelligent postal code grouping to reduce API calls
- **Monitoring**: Real-time performance metrics and error tracking

## 🔒 Security

- **OAuth 2.0**: Secure Meta API authentication
- **JWT Tokens**: Encrypted session management
- **Input Validation**: Comprehensive data sanitization
- **Rate Limiting**: Protection against abuse

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for Meta advertising optimization**
