import React, { useEffect, useState } from "react";
import axios from "axios";
import "../stylesheets/profile.css";
import TimeStamp from './TimeStamp';
import { Link, useParams } from "react-router-dom";

export default function UserProfilePage() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("posts");
    const [items, setItems] = useState([]);
    const [error, setError] = useState("");
    const { id: viewAsUserId } = useParams(); //only present if admin is viewing someone else
    const [loggedInUser, setLoggedInUser] = useState(null); //admin or current user

    //current logged-in user (for permissions & role)
    useEffect(() => {
      async function fetchLoggedInUser() {
        try {
          const res = await axios.get("http://localhost:8000/user/profile", {withCredentials: true,});
          setLoggedInUser(res.data);
        } catch (err) {
          console.error("Failed to load logged-in user info", err);
          setError("Could not load session.");
        }
      }
      fetchLoggedInUser();
    }, []);

    //displayed user’s profile (self or viewAs)
    useEffect(() => {
      async function fetchUser() {
        try {
          const res = viewAsUserId
            ? await axios.get(
                `http://localhost:8000/admin/users/${viewAsUserId}/profile`,{ withCredentials: true }
              )
            : await axios.get("http://localhost:8000/user/profile", {
                withCredentials: true,
              });
          setUser(res.data);
        } catch (err) {
          console.error("Failed to load user info", err);
          setError("Could not load profile.");
        }
      }
      fetchUser();
    }, [viewAsUserId]);

    //baised on active tab (posts/comments/communities)
    useEffect(() => {
      async function fetchItems() {
        if (!user) return;

        try {
          let endpoint = "";
          if (activeTab === "posts")
            endpoint = viewAsUserId
              ? `/admin/users/${viewAsUserId}/posts`
              : "/user/posts";
          if (activeTab === "communities")
            endpoint = viewAsUserId
              ? `/admin/users/${viewAsUserId}/communities`
              : "/user/communities";
          if (activeTab === "comments")
            endpoint = viewAsUserId
              ? `/admin/users/${viewAsUserId}/comments`
              : "/user/comments";
          if (activeTab === "users") endpoint = "/admin/users";

          const res = await axios.get(`http://localhost:8000${endpoint}`, {
            withCredentials: true,
          });
          setItems(res.data);
        } catch (err) {
          console.error("Failed to load items", err);
          setItems([]);
          setError("Could not load " + activeTab);
        }
      }

      fetchItems();
    }, [activeTab, user, viewAsUserId]);

    async function handleDelete(id) {
        if (!window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) return;
    
        let endpoint = "";
        if (activeTab === "posts") endpoint = `/delete-post/${id}`;
        else if (activeTab === "communities") endpoint = `/delete-community/${id}`;
        else if (activeTab === "comments") endpoint = `/delete-comment/${id}`;
        else if (activeTab === "users") endpoint = `/admin/users/${id}`;
    
        try {
            await axios.delete(`http://localhost:8000${endpoint}`, { withCredentials: true });
            setItems(prev => prev.filter(item => item._id !== id));
        } catch (err) {
            console.error("Delete error:", err);
            setError(`Failed to delete ${activeTab.slice(0, -1)}.`);
        }
    }

    if (error) {
      return (
        <div className="profile-page">
          <p style={{ color: "red" }}>{error}</p>
        </div>
      );
    }
  
    if (!user || !loggedInUser) {
      return (
        <div className="profile-page">
          <p>Loading profile...</p>
        </div>
      );
    }
  
    const isAdmin = loggedInUser.role === "admin";
    const isSelf = String(loggedInUser._id) === String(user._id);
    
    console.log("loggedInUser._id:", loggedInUser._id);
    console.log("user._id:", user._id);
    console.log("isSelf:", isSelf);
    console.log("isAdmin:", isAdmin);

    
    return (
        <div className="profile-page">
          <h2>
          {isAdmin && !isSelf ? `Admin Viewing: ${user.displayName}`
            : user.role === "admin"
            ? "Admin Profile"
            : "User Profile"}
        </h2>
      
          <div className="user-info">
            <p><strong>Display Name:</strong> {user.displayName}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Reputation:</strong> {user.reputation}</p>
            <p><strong>Member Since:</strong> {TimeStamp(user.dateJoined)}</p>
          </div>
      
          <div className="tab-buttons" style={{ marginTop: "1rem" }}>
            <button
              onClick={() => setActiveTab("posts")}
              className={activeTab === "posts" ? "active-tab" : ""}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab("communities")}
              className={activeTab === "communities" ? "active-tab" : ""}
            >
              Communities
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={activeTab === "comments" ? "active-tab" : ""}
            >
              Comments
            </button>
            {loggedInUser?.role === "admin" && isSelf && (
              <button
                onClick={() => setActiveTab("users")}
                className={activeTab === "users" ? "active-tab" : ""}
              >
                All Users
              </button>
            )}
          </div>

          <div className="listing-section" style={{ marginTop: "2rem" }}>
            {items.length === 0 ? (
              <p>No {activeTab} found.</p>
            ) : (
              <ul>
                {items.map((item, idx) => (
                  <li key={item._id || idx} className="profile-list-item">
                    {activeTab === "posts" && (
                      <div className="item-row">
                        <Link to={`/edit-post/${item._id}`}>{item.title}</Link>
                        <button className="delete-btn" onClick={() => handleDelete(item._id)}>Delete</button>
                      </div>
                    )}
                    {activeTab === "communities" && (
                      <div className="item-row">
                        <Link to={`/edit-community/${item._id}`}>{item.name}</Link>
                        <button className="delete-btn" onClick={() => handleDelete(item._id)}>Delete</button>
                      </div>
                    )}
                    {activeTab === "comments" && (
                      <div className="item-row">
                        <Link to={`/edit-comment/${item._id}`}>
                          On: <em>{item.postTitle || "Unknown Post"}</em> — "
                          {item.content ? item.content.slice(0, 20) : "[No content]"}..."
                        </Link>
                        <button className="delete-btn" onClick={() => handleDelete(item._id)}>Delete</button>
                      </div>
                    )}
                    {activeTab === "users" && (
                      <div className="item-row">
                          <span>
                              <strong>{item.displayName}</strong> ({item.email}) - Rep: {item.reputation}
                            </span>
                            <button className="delete-btn" onClick={() => handleDelete(item._id)}>Delete</button>
                            <Link to={`/admin/user/${item._id}`} style={{ marginLeft: "1rem" }}>View</Link>
                          </div>
                        )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    }      