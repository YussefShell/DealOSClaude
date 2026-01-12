# DealOS - Modern M&A Transaction Platform

A secure, multi-tenant SaaS platform for managing M&A transactions with AI-powered due diligence capabilities. DealOS serves as an intelligent Virtual Data Room (VDR) that replaces traditional tools like Intralinks and Datasite with modern UX and built-in intelligence.

## Features

### Core Functionality

- **Secure Virtual Data Rooms**: Enterprise-grade security with encryption, granular access controls, and comprehensive audit logs
- **Multi-Tenant Architecture**: Complete data isolation between deals and organizations
- **Role-Based Access Control**: Deal Owner, Seller Team, Buyer, Advisor, and View-Only roles with granular permissions
- **Document Management**: Drag-and-drop upload, folder organization, versioning, and search capabilities
- **Activity Tracking**: Real-time monitoring of who viewed what, when, and for how long

### AI-Powered Features

- **Intelligent Document Analysis**: Automatic document classification and key information extraction
- **Contract Analysis**: Extract parties, terms, obligations, and change of control provisions
- **Financial Data Extraction**: Automatically identify revenue, EBITDA, debt, and key financial metrics
- **Risk Flagging**: AI identifies potential red flags and concerns for due diligence
- **Executive Summaries**: Auto-generated document summaries to accelerate review

### Collaboration Tools

- **Q&A Module**: Threaded discussions for buyer questions and seller responses
- **Analytics Dashboard**: Track deal activity, document views, downloads, and user engagement
- **Real-Time Notifications**: Alerts for new documents, questions, and access changes
- **Activity Heatmaps**: Visualize buyer interest across document categories

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality UI components
- **React Query** - Data fetching and caching
- **Zustand** - State management

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **PostgreSQL** - Relational database
- **Prisma ORM** - Type-safe database access
- **NextAuth.js** - Authentication
- **bcryptjs** - Password hashing

### AI/ML
- **Anthropic Claude API** - Document analysis and extraction
- **pdf-parse** - PDF text extraction

### Security
- **End-to-end encryption** - Data at rest and in transit
- **JWT tokens** - Secure session management
- **RBAC** - Role-based access control
- **Audit logs** - Comprehensive activity tracking

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Anthropic API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DealOSClaude
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

   Required variables:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/dealos"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-here"
   ANTHROPIC_API_KEY="your-anthropic-key"
   ```

   Generate `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Create uploads directory**

   ```bash
   mkdir uploads
   ```

6. **Run the development server**

   ```bash
   npm run dev
   ```

7. **Open the application**

   Navigate to [http://localhost:3000](http://localhost:3000)

### First Time Setup

1. **Create an account**: Click "Get Started" and sign up with your email
2. **Create your first deal room**: Click "New Deal Room" on the dashboard
3. **Upload documents**: Use the "Upload Files" button to add documents to folders
4. **Analyze documents**: Documents are automatically analyzed by AI upon upload (requires Anthropic API key)
5. **Invite participants**: Add team members and buyers to your deal rooms

## Project Structure

```
DealOSClaude/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── deals/         # Deal management
│   │   │   └── documents/     # Document operations
│   │   ├── auth/              # Auth pages (signin, signup)
│   │   ├── dashboard/         # Main application
│   │   │   ├── deals/         # Deal management pages
│   │   │   ├── analytics/     # Analytics dashboard
│   │   │   └── qa/            # Q&A module
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── deals/             # Deal-specific components
│   │   └── dashboard/         # Dashboard components
│   ├── lib/
│   │   ├── ai/                # AI integration (Claude)
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── prisma.ts          # Prisma client
│   │   └── utils.ts           # Utility functions
│   └── types/
│       ├── index.ts           # Type definitions
│       └── next-auth.d.ts     # NextAuth types
├── uploads/                   # File storage (local)
└── package.json
```

## Database Schema

### Key Models

- **User**: Authentication and user profiles
- **Organization**: Multi-tenant organizations
- **Deal**: M&A deal rooms
- **Document**: Uploaded files with metadata
- **Folder**: Organizational structure
- **DealParticipant**: User access to deals
- **DocumentPermission**: Granular document access
- **DocumentActivity**: Audit log of all document interactions
- **AIExtraction**: AI-generated insights and data
- **QAThread/QAResponse**: Q&A discussions

See `prisma/schema.prisma` for the complete schema.

## API Documentation

### Authentication

- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Sign in (handled by NextAuth)
- `GET /api/auth/session` - Get current session

### Deals

- `GET /api/deals` - List all accessible deals
- `POST /api/deals` - Create new deal
- `GET /api/deals/[id]` - Get deal details
- `PUT /api/deals/[id]` - Update deal
- `DELETE /api/deals/[id]` - Delete deal

### Documents

- `POST /api/documents/upload` - Upload document
- `GET /api/documents/[id]/download` - Download document
- `POST /api/documents/[id]/analyze` - Trigger AI analysis
- `GET /api/documents/[id]/analyze` - Get AI analysis results

## AI Features

### Document Analysis

DealOS uses Anthropic's Claude AI to automatically analyze uploaded documents:

1. **Document Classification**: Identifies document type (contract, financial statement, etc.)
2. **Key Information Extraction**: Pulls out critical data points
3. **Executive Summary**: Generates 2-3 sentence summaries
4. **Risk Flagging**: Identifies potential concerns
5. **Specialized Extraction**: Contract terms, financial metrics, corporate info

### Triggering Analysis

Analysis can be triggered via:
- Automatic: On document upload (if API key is configured)
- Manual: Via API endpoint `/api/documents/[id]/analyze`

### Example Analysis Output

```json
{
  "classification": "Commercial Contract",
  "summary": "Master Services Agreement between Acme Corp and Beta Inc...",
  "keyPoints": [
    "3-year term with automatic renewal",
    "Change of control provisions require consent",
    "90-day termination notice required"
  ],
  "extractedData": {
    "parties": ["Acme Corp", "Beta Inc"],
    "effectiveDate": "2024-01-01",
    "termLength": "3 years"
  },
  "riskFlags": [
    "Change of control clause may impact deal structure"
  ],
  "confidenceScore": 0.92
}
```

## Security Considerations

### Current Implementation

- ✅ Password hashing with bcryptjs
- ✅ JWT-based sessions
- ✅ Role-based access control
- ✅ SQL injection protection (Prisma ORM)
- ✅ CSRF protection (Next.js)
- ✅ Comprehensive audit logging

### Production Recommendations

1. **File Storage**: Migrate from local filesystem to AWS S3 or Cloudflare R2
2. **Database**: Use managed PostgreSQL (AWS RDS, Supabase, etc.)
3. **Encryption**: Implement encryption at rest for sensitive documents
4. **2FA**: Add two-factor authentication (code is prepared in schema)
5. **Rate Limiting**: Add API rate limiting for production
6. **DDoS Protection**: Use Cloudflare or similar service
7. **Environment Variables**: Use secure secret management (AWS Secrets Manager, Vault)
8. **Watermarking**: Implement PDF watermarking on downloads
9. **Session Timeout**: Configure automatic session timeout
10. **IP Whitelisting**: Enable IP restrictions for sensitive deals

## Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Configure PostgreSQL** database (Vercel Postgres, Supabase, etc.)
4. **Deploy**

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npx prisma generate
RUN npm run build
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t dealos .
docker run -p 3000:3000 --env-file .env dealos
```

### Traditional Server

1. Build the application: `npm run build`
2. Set up PostgreSQL database
3. Run migrations: `npx prisma migrate deploy`
4. Start the server: `npm start`
5. Use Nginx or Apache as reverse proxy

## Development

### Running Tests

```bash
npm run test
```

### Database Management

```bash
# Create new migration
npx prisma migrate dev --name description

# Reset database
npx prisma migrate reset

# View database
npx prisma studio
```

### Linting

```bash
npm run lint
```

## Roadmap

### Phase 1 (MVP) ✅
- [x] Authentication and user management
- [x] Deal room creation and management
- [x] Document upload and organization
- [x] Basic AI document analysis
- [x] Activity tracking and audit logs
- [x] Analytics dashboard
- [x] Q&A module

### Phase 2 (Planned)
- [ ] Advanced search with AI embeddings
- [ ] Bulk document operations
- [ ] NDA signing and e-signatures
- [ ] Participant invitation flow
- [ ] Email notifications
- [ ] Two-factor authentication
- [ ] Document viewer (in-browser PDF preview)
- [ ] Redaction tools
- [ ] Watermarking on downloads

### Phase 3 (Future)
- [ ] Microsoft/Google SSO
- [ ] Advanced analytics with charts
- [ ] Task management
- [ ] Mobile app
- [ ] API webhooks
- [ ] White-label support
- [ ] Compliance certifications (SOC 2)

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql $DATABASE_URL
```

### File Upload Issues

- Check `uploads/` directory exists and has write permissions
- Verify file size is under 100MB limit
- Check available disk space

### AI Analysis Not Working

- Verify `ANTHROPIC_API_KEY` is set correctly
- Check API key has sufficient credits
- Review error logs: `console.error` in `/api/documents/[id]/analyze`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Email: support@dealos.example.com

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI powered by [Anthropic Claude](https://www.anthropic.com/)
- Database ORM by [Prisma](https://www.prisma.io/)

---

**Note**: This is an MVP implementation. For production use, implement the security recommendations listed above and conduct a thorough security audit.
