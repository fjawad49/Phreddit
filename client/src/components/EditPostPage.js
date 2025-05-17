import "../stylesheets/forms.css"; 
import { useNavigate, useParams } from "react-router-dom";
import { TextBox, validateLinks, DropDown } from "./FormComponents";
import { useEffect, useState } from "react";
import axios from "axios";

export default function EditPostPage() {
    const navigate = useNavigate();
    const { id } = useParams(); //post ID from /edit-post/:id
    const isEditing = Boolean(id);

    const [error, setError] = useState('');
    const [communities, setCommunities] = useState([]);
    const [linkFlairs, setLinkFlairs] = useState([]);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [selectedCommunity, setSelectedCommunity] = useState("");
    const [selectedFlair, setSelectedFlair] = useState("");
    const [customFlairText, setCustomFlairText] = useState("");

    useEffect(() => {
        async function fetchData() {
            try {
                const [comRes, flairRes, joinedRes] = await Promise.all([
                    axios.get("http://localhost:8000/communities"),
                    axios.get("http://localhost:8000/linkflairs"),
                    axios.get("http://localhost:8000/user-communities", { withCredentials: true })
                ]);
                const joinedIds = new Set(joinedRes.data.map(c => c._id));
                const sortedCommunities = [
                    ...comRes.data.filter(c => joinedIds.has(c._id)),
                    ...comRes.data.filter(c => !joinedIds.has(c._id))
                ];
                setCommunities(sortedCommunities);
                setLinkFlairs(flairRes.data);
            } catch (err) {
                console.error("Failed to fetch form data:", err);
                setError("Failed to load form options");
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (isEditing) {
            axios.get(`http://localhost:8000/posts/${id}`, { withCredentials: true })
                .then(res => {
                    const post = res.data;
                    setTitle(post.title);
                    setContent(post.content);
                    setSelectedCommunity(post.communityId); //should be a valid _id
                    setSelectedFlair(post.linkFlairID || "");
                })
                .catch(err => {
                    console.error("Error loading post:", err);
                    setError("Could not load post for editing.");
                });
        }
    }, [id]);

    async function handleForm(e){
        e.preventDefault();
        const links = validateLinks(content);
        if (!links.success){
            setError(links.error);
            return;
        }

        let flair = selectedFlair;
        if (!flair || flair === "none") {
            if (customFlairText.trim()) {
                try {
                    const newFlairRes = await axios.post("http://localhost:8000/new-linkflair", { content: customFlairText });
                    flair = newFlairRes.data._id;
                } catch (err) {
                    console.error("Failed to create custom flair:", err);
                    return setError("Failed to create custom flair");
                }
            } else {
                flair = null;
            }
        }

        const postData = {
            title,
            content,
            linkFlairID: flair,
        };

        try {
            await axios.put(`http://localhost:8000/update-post/${id}`, postData, { withCredentials: true });
            navigate("/profile");
        } catch (err) {
            console.error("Submit failed:", err);
            const msg = err.response?.data?.error || "Failed to submit post";
            setError(msg);
        }
    }

    //drop-down and flair mapping
    const communityMap = {};
    communities.forEach(c => communityMap[c.name] = c._id);

    const flairMap = {};
    linkFlairs.forEach(f => flairMap[f.content] = f._id);

    async function handleDelete() {
      const confirmDelete = window.confirm("Are you sure you want to delete this post? This cannot be undone.");
      if (!confirmDelete) return;
    
      try {
        await axios.delete(`http://localhost:8000/delete-post/${id}`, {
          withCredentials: true
        });
        navigate("/profile");
      } catch (err) {
        console.error("Delete failed:", err);
        setError("Failed to delete post");
      }
    }
    
    return (
        <form className="create-page" onSubmit={handleForm}>
          <h2>{isEditing ? "Edit Post" : "Create New Post"}</h2>
      
          <div className="form-group">
            <DropDown 
              name="Community" 
              values={communityMap} 
              selected={selectedCommunity}
              onChange={val => setSelectedCommunity(val)}
              disabled={isEditing} //cannot change community when editing
              placeholder="Select a community"
            />
          </div>
      
          <div className="form-group">
            <TextBox 
              name="Title" 
              maxchars="100" 
              placeholder="Title...(Max 100 Characters)"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
      
          <div className="form-group">
            <DropDown 
              name="Link Flair" 
              placeholder="Custom/None" 
              values={flairMap}
              required={false}
              customInput={true}
              customAttributes={{
                maxchars: "30",
                required: false,
                name: "Custom Flair",
                placeholder: "Flair...(Max 30 Characters)"
              }}
              selected={selectedFlair}
              customValue={customFlairText}
              onChange={val => setSelectedFlair(val)}
              onCustomChange={e => setCustomFlairText(e.target.value)}
            />
          </div>
      
          <div className="form-group">
            <TextBox 
              name="Content" 
              multiline={true}
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
      
          {error && (
            <div className="form-error" style={{ color: "red", marginBottom: "1rem" }}>
              {error}
            </div>
          )}
      
          <input 
            className="submit-button" 
            type="submit" 
            value={isEditing ? "Save Changes" : "Submit Post"} 
          />

          <button
            type="button"
            className="delete-button"
            onClick={handleDelete}
            style={{ marginTop: "1rem" }}
          >
            Delete Post
          </button>
        </form>
      );
}      