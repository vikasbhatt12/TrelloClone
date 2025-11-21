# Mini Trello Clone + Smart Recommendations

A simplified Trello-style board application with collaboration features and a unique "Smart Recommendations" engine. Built with the MERN stack.

## Features

- **Boards & Lists**: Create boards, lists, and cards.
- **Drag & Drop**: Move cards between lists easily.
- **Collaboration**: Invite other users to your board via email.
- **Smart Recommendations**:
  - **Due Date Suggestions**: Detects keywords like "urgent", "tomorrow" in card titles/descriptions.
  - **List Movement**: Suggests moving cards to "In Progress" or "Done" based on status keywords.
  - **Related Cards**: Finds cards with similar content or shared members.
- **Authentication**: Secure JWT-based login and registration.

## Tech Stack

- **Frontend**: React (Vite), TailwindCSS, React Beautiful DnD (Hello Pangea fork).
- **Backend**: Node.js, Express.js, MongoDB, Mongoose.
- **Auth**: JSON Web Tokens (JWT).

## Architecture

### Backend
- **Controllers**: Handle request logic for Auth, Boards, Lists, and Cards.
- **Services**: `recommendationEngine.js` contains the core logic for generating suggestions.
- **Models**: Mongoose schemas for data persistence.
- **Middleware**: `authMiddleware.js` protects private routes.

### Frontend
- **Pages**: `Dashboard` (list boards), `BoardView` (kanban view), `Login`, `Register`.
- **Components**: `RecommendationsPanel` displays insights. `Navbar` for navigation.
- **Context**: `AuthContext` manages user session state.

## Setup Instructions

### Prerequisites
- Node.js installed.
- MongoDB running locally (or update `.env` with Atlas URI).

### Backend Setup
1. Navigate to `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file:
   ```env
   PORT=5000
   MONGO_URI=Your_mongodb_url
   JWT_SECRET=your_secret_key
   ```
4. Start the server:
   ```bash
   npm start
   # or
   node server.js
   ```

### Frontend Setup
1. Navigate to `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Recommendation Logic
The recommendation engine (`backend/services/recommendationEngine.js`) analyzes card content:
- **Urgency**: "urgent", "asap" -> Suggests tomorrow as due date.
- **Status**: "started", "working" -> Suggests moving to "In Progress" list.
- **Relations**: Matches words in title/description to find related cards.

## Database Schema
- **User**: `name`, `email`, `password`.
- **Board**: `title`, `owner`, `members` (array of User IDs).
- **List**: `title`, `board`, `position`.
- **Card**: `title`, `description`, `list`, `board`, `members`, `dueDate`.
