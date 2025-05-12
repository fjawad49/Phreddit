import "../stylesheets/forms.css";
import React, { useState, useEffect } from "react";
import { TextBox, validateLinks } from "./FormComponents";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export default function EditCommunityPage() {
  const { id } = useParams(); //community ID from /edit-community/:id
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCommunity() {
      try {
        const res = await axios.get(`http://localhost:8000/communities/${id}`);
        const comm = res.data;
        setName(comm.name);
        setDescription(comm.description);
      } catch (err) {
        console.error("Failed to load community:", err);
        setError("Failed to load community details");
      }
    }

    fetchCommunity();
  }, [id]);

  async function handleForm(e) {
    e.preventDefault();
    const links = validateLinks(description);
    if (!links.success) {
      setError(links.error);
      return;
    }

    try {
      await axios.put(`http://localhost:8000/update-community/${id}`, {
        name,
        description,
      }, {
        withCredentials: true
      });

      navigate(`/`); //or redirect to `/profile` or `/communities/${id}`
    } catch (err) {
      console.error("Update failed:", err);
      setError("Failed to update community");
    }
  }

  async function handleDelete() {
    const confirm = window.confirm("Are you sure you want to delete this community? This cannot be undone.");
    if (!confirm) return;

    try {
      await axios.delete(`http://localhost:8000/delete-community/${id}`, {
        withCredentials: true
      });
      navigate("/profile");
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete community");
    }
  }

  return (
    <form className="create-page" onSubmit={handleForm}>
      <h2>Edit Community</h2>

      <TextBox
        name="Community Name"
        maxchars="100"
        value={name}
        onChange={e => setName(e.target.value)}
        required={true}
        placeholder="Name..."
        //disable editing name if not allowed
        disabled={true}
      />

      <TextBox
        multiline={true}
        maxchars="500"
        name="Community Description"
        placeholder="Description...(Max 500 Characters)"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />

      <span style={{ color: "red", display: "block" }}>{error}</span>

      <input className="submit-button" type="submit" value="Save Changes" />

      <button type="button" className="delete-button" onClick={handleDelete} style={{ marginTop: "1rem" }}>
        Delete Community
      </button>
    </form>
  );
}