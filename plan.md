### Project Plan: Kistet Addis - Supabase Removal and Custom Backend Implementation

**Objective:** To completely remove Supabase from the project and establish a custom backend architecture using Node.js/Express with PostgreSQL, while updating the frontend to communicate with the new API.

**Key Technologies:**
- Frontend: React 19.1.1, Vite, Tailwind CSS, Shadcn/UI
- Backend: Node.js, Express.js
- Database: PostgreSQL
- Authentication: JWT

**Phase 1: Supabase Removal**
1.  **Dependency Management:**
    *   Remove Supabase-related packages (e.g., `@supabase/supabase-js`) from `package.json`.
    *   Install new backend dependencies: `express`, `pg`, `jsonwebtoken`, `bcryptjs`, `dotenv`.
2.  **Codebase Cleanup:**
    *   Delete Supabase client setup files: `src/lib/supabase.ts`, `src/lib/supabaseClient.js`, `src/lib/supabaseClient.ts`.
    *   Delete all files within the `supabase/migrations/` directory.
    *   Remove all Supabase SDK calls from frontend components and contexts (e.g., `src/context/AuthContext.tsx`, `src/pages/*`, `src/components/*`). This includes removing references to Supabase authentication and data fetching.

**Phase 2: Custom Backend Development**
1.  **Project Structure:**
    *   Create a `backend` directory at the root of the project.
    *   Inside `backend`, create:
        *   `server.js`: Main Express application file.
        *   `.env`: Environment variables configuration.
        *   `db.js` (or similar): PostgreSQL connection setup using `pg`.
        *   `middleware/auth.js`: JWT authentication middleware.
        *   `routes/`: Directory for API route handlers.
        *   `controllers/`: Directory for business logic.
2.  **Database Setup (PostgreSQL):**
    *   Define and create the following tables:
        *   **Users:**
            *   `id` (UUID, PRIMARY KEY)
            *   `name` (VARCHAR)
            *   `email` (VARCHAR, UNIQUE)
            *   `password` (VARCHAR) - Hashed using bcryptjs
            *   `role` (VARCHAR, ENUM: 'admin', 'organizer', 'customer')
            *   `created_at` (TIMESTAMP, DEFAULT NOW())
        *   **Events:**
            *   `id` (UUID, PRIMARY KEY)
            *   `title` (VARCHAR)
            *   `description` (TEXT)
            *   `date` (TIMESTAMP)
            *   `location` (VARCHAR)
            *   `latitude` (DECIMAL)
            *   `longitude` (DECIMAL)
            *   `price` (DECIMAL)
            *   `total_tickets` (INTEGER)
            *   `created_by` (UUID, FOREIGN KEY REFERENCES Users(id))
            *   `created_at` (TIMESTAMP, DEFAULT NOW())
        *   **Tickets:**
            *   `id` (UUID, PRIMARY KEY)
            *   `event_id` (UUID, FOREIGN KEY REFERENCES Events(id))
            *   `user_id` (UUID, FOREIGN KEY REFERENCES Users(id)) - Optional, if user is logged in
            *   `user_name` (VARCHAR)
            *   `phone` (VARCHAR)
            *   `email` (VARCHAR)
            *   `quantity` (INTEGER)
            *   `qr_code` (TEXT) - Store generated QR code data/path
            *   `status` (VARCHAR, ENUM: 'pending', 'approved', 'cancelled')
            *   `created_at` (TIMESTAMP, DEFAULT NOW())
        *   **Payments:**
            *   `id` (UUID, PRIMARY KEY)
            *   `ticket_id` (UUID, FOREIGN KEY REFERENCES Tickets(id))
            *   `method` (VARCHAR, ENUM: 'Telebirr', 'CBE', 'M-Pesa')
            *   `transaction_id` (VARCHAR, UNIQUE)
            *   `status` (VARCHAR, ENUM: 'pending', 'approved', 'failed')
            *   `payment_url` (TEXT) - For generating payment links
            *   `created_at` (TIMESTAMP, DEFAULT NOW())
    *   SQL migration scripts should be created for these tables.
3.  **API Routes Implementation:**
    *   Set up Express server to listen on port 5000.
    *   Implement the following routes within `backend/routes/` and handle logic in `backend/controllers/`:
        *   `POST /auth/register` (for initial admin/organizer setup)
        *   `POST /auth/login` (for Admin and Organizer roles, returns JWT)
        *   `POST /events` (Create Event - requires Admin/Organizer auth)
        *   `GET /events` (Fetch Events - public)
        *   `GET /events/:id` (Fetch single Event)
        *   `PUT /events/:id` (Update Event - requires Admin/Organizer auth)
        *   `DELETE /events/:id` (Delete Event - requires Admin/Organizer auth)
        *   `POST /tickets` (Create Ticket - public/user, potentially linked to payment)
        *   `GET /tickets` (Fetch User's Tickets - requires user auth)
        *   `GET /tickets/:id` (Fetch single Ticket - requires user auth)
        *   `POST /payments` (Submit Payment - public/user, creates payment record, generates payment link)
        *   `GET /payments/:id` (Fetch Payment details - requires user/admin auth)
        *   `GET /payments` (List Payments - requires Admin auth)
        *   `POST /payments/:id/approve` (Approve Payment - requires Admin auth)
        *   `POST /payments/:id/reject` (Reject Payment - requires Admin auth)
        *   `POST /users/organizer` (Add new organizer - requires Admin auth)
        *   `GET /users/organizers` (List organizers - requires Admin auth)
4.  **Authentication (JWT):**
    *   Implement user registration (initial admin/organizer).
    *   Implement login endpoints for Admin and Organizer roles.
    *   Generate JWT upon successful login, including user ID and role.
    *   Create JWT verification middleware to protect routes.
5.  **Payment Logic:**
    *   For Telebirr: Construct payment URL `https://transactioninfo.ethiotelecom.et/receipt/{transaction_id}`.
    *   For CBE: Construct payment URL `https://apps.cbe.com.et:100/?id={transaction_id}`.
    *   Store generated URLs and transaction IDs in the `Payments` table.
    *   Implement an admin endpoint to review and approve/reject payments.
    *   Update ticket status to 'approved' upon payment approval.
6.  **QR Code Generation:**
    *   After a ticket is approved (payment is approved), generate a QR code.
    *   The QR code content should include: Ticket Holder Name, Event Title, Event Date, Event Location.
    *   A client-side library (e.g., `qrcode.react`) can be used in the frontend to display the QR code. The generated QR code data/path could be stored in the `Tickets` table.

**Phase 3: Frontend Integration**
1.  **Authentication Context Update:**
    *   Modify `src/context/AuthContext.tsx` to handle JWT-based authentication.
    *   Implement login/logout functions that interact with the new `/auth/login` API endpoint.
    *   Store JWT and user role/details in local storage or context.
2.  **API Call Replacement:**
    *   Replace all instances of Supabase SDK calls with `fetch` requests to the corresponding new backend API endpoints (e.g., `fetch('http://localhost:5000/events', { method: 'POST', ... })`).
    *   Ensure proper handling of request methods (GET, POST, PUT, DELETE), headers (e.g., `Content-Type: 'application/json'`, `Authorization: 'Bearer <JWT>'`), and request bodies.
    *   Handle API responses, including success and error states.
3.  **Page and Component Updates:**
    *   **Create Event Page (`src/pages/CreateEventPage.tsx`):** Update form submission to POST to `/events`.
    *   **Purchase Flow (`src/pages/PurchaseFlow.tsx`, `src/components/TicketPurchaseFlow.tsx`):** Update ticket creation (POST `/tickets`) and payment submission (POST `/payments`). Handle display of payment links and redirection.
    *   **Admin Dashboard (`src/pages/AdminDashboard.tsx`, `src/pages/AdminSettings.tsx`):** Update event management (PUT/DELETE `/events/:id`), payment approval (POST `/payments/:id/approve`), and potentially fetching revenue data.
    *   **Event Details (`src/pages/EventDetailsPage.tsx`, `src/components/EventCard.tsx`):** Update to fetch events from `GET /events`.
    *   **QR Code Display:** Implement logic to fetch ticket details and display generated QR codes (using a library like `qrcode.react`) on relevant pages (e.g., user's ticket list, admin view).
4.  **Error Handling and Loading States:** Implement robust error handling and loading indicators for all API interactions.

**Phase 4: Admin Features and QR Code Generation**
1.  **Admin Role Implementation:**
    *   Ensure Admin specific functionalities (event creation/management, payment approval, viewing revenue, managing organizers) are correctly implemented using the new API endpoints and JWT authentication.
    *   Implement default Admin user: Username: `KistetAddis`, Password: `12345678` (hashed password in DB).
2.  **QR Code Generation Logic:**
    *   Integrate QR code generation library on the frontend.
    *   Trigger QR code generation and display upon payment approval and ticket creation.

**Phase 5: Finalization and Deployment Preparation**
1.  **Testing:** Thoroughly test all functionalities, including authentication, API endpoints, data persistence, payment flows, and QR code generation.
2.  **Run Instructions:**
    *   Provide clear instructions for running the frontend and backend:
        *   Install dependencies: `npm install` (or `yarn install`) in root, and `npm install` (or `yarn install`) in `backend` directory.
        *   Run frontend: `npm run dev` (or `yarn dev`)
        *   Run backend: `node backend/server.js` (or `nodemon backend/server.js` for development)
    *   Explain `.env` file setup for PostgreSQL connection and JWT secrets.
3.  **Documentation:** Update `plan.md` if necessary.

**Assumptions:**
- PostgreSQL database is accessible.
- A mechanism for initial Admin/Organizer account creation will be provided or implemented.
- Frontend component for QR code display will be implemented.
- Payment gateway integration details beyond URL construction are handled server-side or via external services.

**Risks:**
- Incomplete removal of Supabase code may cause conflicts.
- Complexity of JWT implementation and security.
- Data migration challenges from Supabase schema to PostgreSQL.
- Potential inconsistencies between frontend expectations and backend API responses.
- Ensuring all data is correctly transferred or re-created.
