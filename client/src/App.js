// ************** THIS IS YOUR APP'S ENTRY POINT. CHANGE THIS FILE AS NEEDED. **************
// ************** DEFINE YOUR REACT COMPONENTS in ./components directory **************
import './stylesheets/App.css';
import Banner from './components/Banner';
import Navbar from './components/Navbar';
import HomePage from './components/Homepage.js';
import PostCreatePage from './components/PostCreatePage.js';
import CommunityCreatePage from './components/CommunityCreatePage.js';
import './stylesheets/banner.css'; 
import './stylesheets/navbar.css'; 
import './stylesheets/homepage.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CommunityPage from './components/CommunityPage.js';
import CommentCreatePage from './components/CommentCreatePage.js';
import PostPage from './components/PostPage.js';
import Search from "./components/Search";
import WelcomePage from './components/WelcomePage.js';
import './stylesheets/search.css';
import { useState } from 'react';

function App() {
  return (
    <Router>
      <Banner />
      <div className="app-container">
        {(
          <>
            <Navbar />  
            <section className="main-content">
              <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/create-post" element={<PostCreatePage />} />
              <Route path="/create-community" element={<CommunityCreatePage />} />
              <Route path="/search" element={<Search />} />
              <Route path="/:communityID/posts/:postID" element={<PostPage  />} />
              <Route path="/:communityID/posts/:postID/comment/new" element={<CommentCreatePage  />} />
              <Route path="/:communityID/posts/:postID/comment/:commentID/reply" element={<CommentCreatePage/>} />
              <Route path="/:communityID" element={<CommunityPage />} />
              </Routes>
            </section>
          </>
        )}
      </div>
    </Router>
  );
}

export default App;
