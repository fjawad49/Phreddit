import "../stylesheets/forms.css";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { TextBox, validateLinks } from "./FormComponents.js";
import axios from "axios";
import { ErrorPage } from "./WelcomePage.js";
axios.defaults.withCredentials = true;

export default function CommentCreatePage() {
    let params = useParams();
    const navigate = useNavigate();
    const [edit, setEdit] = useState(false);
    const [errorPage, setErrorPage] = useState(null);
    const [content, setContent] = useState('');
    const [contentError, setContentError] = useState('');
    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        async function fetchComment() {
            try {
                const res = await axios.get(`http://localhost:8000/comments/${params.commentID}`);
                console.log(res.data)
                setContent(res.data.comment.content);
                params.postID = res.data.comment.post;
                params.communityID = res.data.comment.community;
            } catch (err) {
                console.error("Error loading comment:", err);
                setContentError("Could not load comment.");
            }
        }
        if (!params.postID){
            if (user){
                fetchComment();
                setEdit(true)
            }else{
                setErrorPage("You do not have permission to view this page.")
            }
        } else{
            setContent("")
            setEdit(false)
            setContentError("")
        }
    }, [params.commentID]);

    async function handleUpdate(e) {
        e.preventDefault();
        setContentError('');

        if (!content || content.trim() === '') {
            setContentError("Content cannot be empty.");
            return;
        }

        try {
            await axios.put(`http://localhost:8000/update-comment/${params.commentID}`, { content });
            navigate(`/${params.communityID}/posts/${params.postID}`);
        } catch (err) {
            console.error("Update failed:", err);
            setContentError("Failed to update comment.");
        }
    }

    async function handleDelete() {
        const confirm = window.confirm("Are you sure you want to delete this comment and all its replies?");
        if (!confirm) return;

        try {
            await axios.delete(`http://localhost:8000/delete-comment/${params.commentID}`);
            navigate(`/profile`);
        } catch (err) {
            console.error("Delete failed:", err);
            setContentError("Failed to delete comment.");
        }
    }

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
                    await axios.post(`http://localhost:8000/comment/${params.communityID}/${params.postID}/${params.commentID}/reply`, newComment, {
                        withCredentials: true
                    });
                } else {
                    //top-level comment to a post
                    await axios.post(`http://localhost:8000/post/${params.communityID}/${params.postID}/new-comment`, newComment, {
                        withCredentials: true
                    });
                }
    
                navigate(`/${params.communityID}/posts/${params.postID}`);
            } catch (err) {
                console.error("Comment creation failed:", err);
                setErrorPage(err.response.data || "Failed to create comment or reply");
            }    
        }
    }
    if (errorPage)
        return(<ErrorPage error={errorPage}/>)
    return (
        <form className="create-page" id="new-comment-form" onSubmit={edit ? handleUpdate : handleForm}>
             <h2>{edit ? "Edit Comment" : "New Comment"}</h2>
            <TextBox
                name="Comment Content"
                multiline={true}
                maxchars="500"
                placeholder="Enter Comment Here... (Max 500 Characters)"
                onChange={(e) => setContent(e.target.value)}
                value={content}
            />
            <span style={{color: "red", display: "block"}}>{contentError ? (`${contentError}`) : ('')}</ span>
            <input
                className="submit-button"
                type="submit"
                value={edit ? "Save Changes" : "Submit Comment"}
                style={{ marginTop: "1.5rem" }}
            />
            {edit && (<button
                type="button"
                className="submit-button"
                style={{ marginTop: "1rem", backgroundColor: "#cc0000" }}
                onClick={ handleDelete}
            >
                Delete Comment
            </button>)}
        </form>
    );
}