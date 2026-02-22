# Installation Guide - Personal Expense Tracker

## Quick Start (Recommended)

### Option 1: Automated Setup
```bash
# Make setup script executable
chmod +x setup.sh

# Run setup script
./setup.sh

# Start both servers
chmod +x start.sh
./start.sh
```

### Option 2: Manual Setup

## Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB Atlas** account or local MongoDB installation
- **Git** (optional, for cloning)

## Step 1: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your settings
nano .env
```

### Environment Configuration (.env)
```env
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense_tracker

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Admin Configuration
ADMIN_EMAIL=admin@expensetracker.com
ADMIN_PASSWORD=admin123
```

### Start Backend Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## Step 2: Frontend Setup

```bash
cd frontend

# Install Angular CLI globally (if not installed)
npm install -g @angular/cli

# Install dependencies
npm install

# Start development server
ng serve

# Or start with custom host/port
ng serve --host 0.0.0.0 --port 4200
```

## Step 3: Access the Application

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## Default Credentials

### Admin Account
- **Email**: admin@expensetracker.com
- **Password**: admin123

## MongoDB Setup

### Option 1: MongoDB Atlas (Cloud - Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### Option 2: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use: `MONGODB_URI=mongodb://localhost:27017/expense_tracker`

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Kill process using port 4200
lsof -ti:4200 | xargs kill -9
```

#### MongoDB Connection Issues
- Verify connection string format
- Check network access (whitelist IP in Atlas)
- Ensure database user has proper permissions

#### Angular CLI Issues
```bash
# Reinstall Angular CLI
npm uninstall -g @angular/cli
npm install -g @angular/cli@latest

# Clear npm cache
npm cache clean --force
```

#### Node Modules Issues
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Development Tips

#### Backend Development
```bash
# Watch for changes
npm run dev

# Check logs
tail -f logs/app.log

# Test API endpoints
curl http://localhost:5000/api/health
```

#### Frontend Development
```bash
# Serve with live reload
ng serve

# Build for production
ng build --prod

# Run tests
ng test

# Check for linting issues
ng lint
```

## Production Deployment

### Backend (Heroku/Railway/DigitalOcean)
1. Set environment variables
2. Use `npm start` command
3. Ensure MongoDB Atlas connectivity

### Frontend (Netlify/Vercel)
1. Build: `ng build --prod`
2. Deploy `dist/` folder
3. Configure environment for production API URL

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Expense Endpoints
- `GET /api/expenses` - Get user expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Admin Endpoints
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - Manage users

## Support

For issues and questions:
1. Check this installation guide
2. Review the main README.md
3. Check console logs for errors
4. Verify all environment variables are set correctly

## Next Steps

After successful installation:
1. Create a new user account or use admin credentials
2. Explore the dashboard
3. Add your first expense
4. Check out the admin panel (if admin user)
5. Customize categories and settings
