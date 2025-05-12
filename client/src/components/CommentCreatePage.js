import "../stylesheets/forms.css";
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TextBox, validateLinks } from "./FormComponents.js";
import axios from "axios";
axios.defaults.withCredentials = true;

export default function CommentCreatePage() {
    let params = useParams();
    const navigate = useNavigate();

    const [contentError, setContentError] = useState('');

    async function handleForm(e) {
        setContentError('');

        e.preventDefault();
        const data = new FormData(e.target);
        const content = data.get("Comment Content");
        //const username = data.get("Username");
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user._id) {
            setContentError("You must be logged in to comment.");
            return;
        }


        const linkValidation = validateLinks(content, false);

        if (!linkValidation.success) {
            setContentError(linkValidation.error);
        } else {
            const newComment = {
                content: content,
                postID: params.postID,
                commentIDs: [],
                //commentedBy: user._id
                //commentedDate: new Date(),
            };
            try {
                if (params.commentID) {
                    //reply to a comment
                    await axios.post(`http://localhost:8000/comment/${params.commentID}/reply`, newComment, {
                        withCredentials: true
                    });
                } else {
                    //top-level comment to a post
                    await axios.post(`http://localhost:8000/post/${params.postID}/new-comment`, newComment, {
                        withCredentials: true
                    });
                }
    
                navigate(`/${params.communityID}/posts/${params.postID}`);
            } catch (err) {
                console.error("Comment creation failed:", err);
                setContentError("Failed to create comment or reply");
            }    
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
            <input
                className="submit-button"
                type="submit"
                value="Submit Comment"
                style={{ marginTop: "1.5rem" }}
            />
        </form>
    );
}