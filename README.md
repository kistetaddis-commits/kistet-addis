# Kistet Addis - Run Instructions

## 1. Backend Setup
1. Open a new terminal.
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure the environment:
   Update `backend/.env` with your PostgreSQL connection string and a secure JWT secret.
5. Setup the database:
   Run the SQL commands in `backend/schema.sql` against your PostgreSQL database.
6. Start the server:
   ```bash
   node server.js
   ```

## 2. Frontend Setup
1. In another terminal (at the project root):
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 3. Login Credentials
- **Admin**: 
  - Email/Username: `admin@kistetaddis.com` or `KistetAddis`
  - Password: `12345678`

- **Organizer**:
  - Can be created from the Admin Dashboard.