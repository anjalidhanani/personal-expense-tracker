# Personal Expense Tracker Web Application

A comprehensive MEAN stack web application for personal expense management with user and admin panels.

## 🚀 Features

### User Features
- **Authentication**: Secure user registration and login with JWT
- **Dashboard**: Overview of expenses with charts and statistics
- **Expense Management**: Add, edit, delete, and view expenses
- **Categories**: Default and custom expense categories
- **Analytics**: Monthly trends and category-wise breakdowns
- **Profile Management**: Update personal information and preferences

### Admin Features
- **User Management**: View, activate/deactivate users
- **System Analytics**: Overall platform statistics
- **Expense Monitoring**: View all user expenses
- **Category Management**: Manage system-wide categories

## 🛠 Tech Stack

### Frontend
- **Angular 17** - Modern web framework
- **TypeScript** - Type-safe JavaScript
- **Angular Material** - UI component library
- **Chart.js** - Data visualization
- **RxJS** - Reactive programming

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB
- Angular CLI (`npm install -g @angular/cli`)
- Git

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "Personal Expense Tracker Web Application"
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Update `.env` with your configuration:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense_tracker
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
ADMIN_EMAIL=admin@expensetracker.com
ADMIN_PASSWORD=admin123
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Start the Angular development server:
```bash
ng serve
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Expenses
- `GET /api/expenses` - Get user expenses (with filters)
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/stats` - Get expense statistics

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create custom category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Admin
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status
- `DELETE /api/admin/users/:id` - Delete user

## 📊 Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'user' | 'admin',
  isVerified: Boolean,
  isActive: Boolean,
  preferences: {
    currency: String,
    dateFormat: String,
    theme: 'light' | 'dark'
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Expenses Collection
```javascript
{
  userId: ObjectId (ref: User),
  categoryId: ObjectId (ref: Category),
  amount: Number,
  description: String,
  date: Date,
  paymentMethod: String,
  tags: [String],
  location: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Categories Collection
```javascript
{
  name: String,
  description: String,
  icon: String,
  color: String,
  isDefault: Boolean,
  isActive: Boolean,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Default Admin Account

- **Email**: admin@expensetracker.com
- **Password**: admin123

*Change these credentials in production!*

## 🎯 Usage Guide

### For Users
1. **Register**: Create a new account
2. **Login**: Access your dashboard
3. **Add Expenses**: Click "Add Expense" and fill details
4. **View Analytics**: Check dashboard for insights
5. **Manage Categories**: Create custom categories
6. **Update Profile**: Modify personal information

### For Admins
1. **Login**: Use admin credentials
2. **Dashboard**: View system-wide statistics
3. **User Management**: Monitor and manage users
4. **System Analytics**: Track platform usage

## 🔍 Key Features Explained

### CRUD Operations
- **Create**: Add new expenses and categories
- **Read**: View expenses with filtering and pagination
- **Update**: Edit existing expenses and profile
- **Delete**: Remove expenses and categories

### Frontend-Backend Communication
1. **Angular Services**: Handle API communication
2. **HTTP Interceptors**: Add authentication headers
3. **Guards**: Protect routes based on authentication
4. **Reactive Forms**: Handle user input with validation

### MongoDB Integration
1. **Mongoose Schemas**: Define data structure
2. **Aggregation Pipelines**: Complex data queries
3. **Population**: Join related documents
4. **Indexing**: Optimize query performance

## 🚨 Common Issues & Solutions

### Backend Issues
- **MongoDB Connection**: Check MONGODB_URI in .env
- **Port Conflicts**: Change PORT in .env if 5000 is busy
- **JWT Errors**: Verify JWT_SECRET is set

### Frontend Issues
- **CORS Errors**: Ensure backend allows frontend origin
- **Module Not Found**: Run `npm install` in frontend directory
- **Build Errors**: Check Angular and Node.js versions

## 📁 Project Structure

```
Personal Expense Tracker Web Application/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Custom middleware
│   ├── server.js        # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/    # Services, guards, interceptors
│   │   │   ├── features/# Feature modules
│   │   │   └── shared/  # Shared components
│   │   └── environments/
│   ├── angular.json
│   └── package.json
└── README.md
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
ng test
```

## 🚀 Deployment

### Backend (Heroku/Railway)
1. Set environment variables
2. Deploy from Git repository
3. Ensure MongoDB Atlas is accessible

### Frontend (Netlify/Vercel)
1. Build the application: `ng build`
2. Deploy the `dist/` folder
3. Configure API URL for production

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Email: support@expensetracker.com

## 🔮 Future Enhancements

- Mobile app (React Native/Flutter)
- Receipt image upload
- Expense sharing between users
- Budget planning and alerts
- Data export (PDF/Excel)
- Multi-currency support
- Recurring expense automation

---

**Built with ❤️ using the MEAN Stack**
