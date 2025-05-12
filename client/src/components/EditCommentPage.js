import "../stylesheets/forms.css";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TextBox } from "./FormComponents.js";
import axios from "axios";
axios.defaults.withCredentials = true;

export default function EditCommentPage() {
    const { commentID, postID, communityID } = useParams();
    const navigate = useNavigate();

    const [content, setContent] = useState('');
    const [error, setError] = useState('');

    //load existing comment content
    useEffect(() => {
        async function fetchComment() {
            try {
                const res = await axios.get(`http://localhost:8000/comments/${commentID}`);
                setContent(res.data.content);
            } catch (err) {
                console.error("Error loading comment:", err);
                setError("Could not load comment.");
            }
        }
        fetchComment();
    }, [commentID]);

    async function handleUpdate(e) {
        e.preventDefault();
        setError('');

        if (!content || content.trim() === '') {
            setError("Content cannot be empty.");
            return;
        }

        try {
            await axios.put(`http://localhost:8000/update-comment/${commentID}`, { content });
            navigate(`/${communityID}/posts/${postID}`);
        } catch (err) {
            console.error("Update failed:", err);
            setError("Failed to update comment.");
        }
    }

    async function handleDelete() {
        const confirm = window.confirm("Are you sure you want to delete this comment and all its replies?");
        if (!confirm) return;

        try {
            await axios.delete(`http://localhost:8000/delete-comment/${commentID}`);
            navigate(`/${communityID}/posts/${postID}`);
        } catch (err) {
            console.error("Delete failed:", err);
            setError("Failed to delete comment.");
        }
    }

    return (
        <form className="create-page" id="edit-comment-form" onSubmit={handleUpdate}>
            <TextBox
                name="Comment Content"
                multiline={true}
                maxchars="500"
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
            <span style={{ color: "red", display: "block" }}>
                {error}
            </span>
            <input
                className="submit-button"
                type="submit"
                value="Update Comment"
                style={{ marginTop: "1.5rem" }}
            />
            <button
                type="button"
                className="submit-button"
                style={{ marginTop: "1rem", backgroundColor: "#cc0000" }}
                onClick={handleDelete}
            >
                Delete Comment
            </button>
        </form>
    );
}
