# Plan: Remove Supabase and Integrate Node.js/Express API

The goal is to eliminate all Supabase dependencies from the React frontend and replace them with standard `fetch` calls to the Node.js/Express backend API.

## 1. Update API Client (`src/lib/api.ts`)
Refactor `src/lib/api.ts` to include all necessary methods for the application, ensuring consistency with existing backend endpoints and frontend usage.
- Add `updateProfile` for user profile updates.
- Add `uploadImage` for image uploads.
- Add `getAssignedEvents` for organizer's events.
- Add `getEventTickets` for event ticket management.
- Ensure `createEvent` handles both `price`/`ticket_price` and `date`/`event_date` for compatibility.
- Alias `verifyTicket` as `scanTicket` for consistency across dashboard components.

## 2. Refactor Components and Pages
Update files that still rely on `src/lib/supabase.ts`.
- **`src/components/forms/EventForm.tsx`**:
  - Replace `createEvent` and `supabase` imports with `api` and `useAuth`.
  - Update `onSubmit` to use `api.createEvent` and current user from context.
- **`src/pages/Home.tsx`**:
  - Replace `getAllEvents` from `supabase.ts` with `api.getEvents`.
- **`src/pages/CreateEventPage.tsx`**:
  - Ensure it correctly uses `api.uploadImage` and `api.createEvent`.

## 3. Cleanup Supabase Files and Dependencies
- Delete `src/lib/supabase.ts`.
- Delete `src/lib/supabaseClient.ts` and `src/lib/supabaseClient.js`.
- Remove the `supabase/` directory and all its contents (migrations).
- Update `package.json` to remove `@supabase/supabase-js` and `supabase`.

## 4. Verification
- Validate the build to ensure no broken imports or type errors.
- Ensure authentication headers are correctly applied to all private API requests.
