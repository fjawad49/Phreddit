[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/2tEDYwzN)
# Term Project

Add design docs in *images/*

## Instructions to setup and run project
1. Clone the repository: git clone <your-repo-url>
2. Install server dependencies: 
   cd server
   npm install
3. Install client dependencies:
   cd ../client
   npm install
4. Initialize MongoDB with admin user:
   node server/init.js <admin-email> <admin-display-name> <admin-password>
5. Run MongoDB locally:
   mongodb://127.0.0.1:27017/phreddit
6. Start the backend:
   cd server
   npx nodemon server.js
6. Start the frontend:
   cd client
   npm start
   The site will be now available at http://localhost:3000

## Team Member 1 Contribution
<Sharanya Kataru>
- Implemented MongoDB schemas and init.js script
- Account creation and login/logout functionality
- Banner and Navbar UI/logic for both guest and registered users
- Home page view and behavior for guest and logged-in users
- Community page view with join/leave logic
- Search results view for both guests and registered users
- Post page view for guests and registered users with correct vote/comment UI behavior
- New Community, New Post, and New Comment creation views: Use Cases 15–17
- React unit test

## Team Member 2 Contribution
<Fahim Jawad>
- Set up client/server structure and welcome page
- Fixed login, logout, and post formatting layout
- Fixed voting functionality for posts and comments
- Finalized error functionality
- Admin User Profile Page: Use Case 19
- Express test
- mongoDB test
- UML Diagrams: Class, Sequence, State Machine
