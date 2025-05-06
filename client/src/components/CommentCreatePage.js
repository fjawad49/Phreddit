import "../stylesheets/forms.css";
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TextBox, validateLinks } from "./FormComponents.js";
import axios from "axios";

export default function CommentCreatePage() {
    let params = useParams();
    const navigate = useNavigate();

    const [contentError, setContentError] = useState('');

    async function handleForm(e) {
        setContentError('');

        e.preventDefault();
        const data = new FormData(e.target);
        const content = data.get("Comment Content");
        const username = data.get("Username");

        const linkValidation = validateLinks(content, false);

        if (!linkValidation.success) {
            setContentError(linkValidation.error);
        } else {
            const newComment = {
                content: content,
                commentIDs: [],
                commentedBy: username,
                commentedDate: new Date(),
            };
            if (params.commentID) {
                try {
                    await axios.post(`http://localhost:8000/comment/${params.commentID}/reply`, newComment);
                } catch (err) {
                    console.error("Comment reply creation failed:", err);
                    setContentError("Failed to create reply");
                }
            } else {
                try {
                    console.log(params.postID)
                    await axios.post(`http://localhost:8000/post/${params.postID}/new-comment`, newComment);
                } catch (err) {
                    console.error("New comment creation failed:", err);
                    setContentError("Failed to create comment");
                }
            }
            navigate(`/${params.communityID}/posts/${params.postID}`);
        }
    }

    return (
        <form className="create-page" id="new-comment-form" onSubmit={handleForm}>
            <TextBox
                name="Comment Content"
                multiline={true}
                maxchars="500"
                placeholder="Enter Comment Here... (Max 500 Characters)"
            />
            <span style={{color: "red", display: "block"}}>{contentError ? (`${contentError}`) : ('')}</ span>

            <TextBox
                name="Username"
                placeholder="Username..."
            />

            <input
                className="submit-button"
                type="submit"
                value="Submit Comment"
                style={{ marginTop: "1.5rem" }}
            />
        </form>
    );
}