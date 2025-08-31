# Finance_Me - Personal Finance Management Application

## Overview

Finance_Me is a comprehensive personal finance management application that helps users track their income, expenses, and financial goals. The application provides features for managing accounts, transactions, budgets, and financial goals with an intuitive user interface.

## Features

- **Account Management**: Track multiple accounts (cash, bank, UPI, credit cards)
- **Transaction Tracking**: Record and categorize income and expenses
- **Transaction Features**: Filter, sort, edit, duplicate, and delete transactions
- **Budget Planning**: Create and monitor budgets for different categories
- **Financial Goals**: Set and track progress towards financial goals
- **Dashboard**: Get an overview of your financial health
- **Data Visualization**: View charts and statistics of your spending patterns

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: MongoDB with Mongoose
- **Authentication**: Clerk
- **State Management**: React Query
- **Bundler**: Vite

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- MongoDB instance (local or cloud)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Finance_Me.git
   cd Finance_Me
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   MONGODB_URI=your_mongodb_connection_string
   ```

### Running the Application

#### Development Mode

Run the application in development mode with hot reloading:

```bash
npm run dev
# or
pnpm dev
```

The application will be available at `http://localhost:8080`.

#### Production Build

Build the application for production:

```bash
npm run build
# or
pnpm build
```

Start the production server:

```bash
npm run start
# or
pnpm start
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
├── client/             # Frontend code
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── pages/          # Page components
│   └── App.tsx         # Main application component
├── server/             # Backend code
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── middleware/     # Express middleware
│   └── index.ts        # Server entry point
├── shared/             # Shared code between client and server
└── vite.config.ts      # Vite configuration
```

## API Endpoints

- **Accounts**: `/api/accounts`
- **Transactions**: `/api/transactions`
- **Budgets**: `/api/budgets`
- **Goals**: `/api/goals`
- **Settings**: `/api/settings`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

## License

This project is licensed under the MIT License.
