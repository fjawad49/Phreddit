import {useState} from "react"
import { useNavigate } from "react-router-dom";
import "../stylesheets/forms.css";
import axios from 'axios'

export default function RegisterPage() {
    const navigate = useNavigate();

    //initialize form data
    const [formData, setFormData] = useState({
        firstName: "", //user first name
        lastName: "", //user last name
        email: "", //user email
        displayName: "", //user display name
        password: "", //user pass
        confirmPassword: "" //user confirm pass
    });

    //manage error messages
    const [error, setError] = useState("");

    const handleChange = (e) => {
        //update form data while keeping existing values
        setFormData({
            ...formData, //copy state
            [e.target.name]: e.target.value //update changed values
        });
    };

    const validateAndSubmit = async (e) => {
        e.preventDefault();
        const { firstName, lastName, email, displayName, password, confirmPassword } = formData;

        //client-side validation
        if (firstName === "") 
            return setError("First name field cannot be empty.");
        if (lastName === "") 
            return setError("Last name field cannot be empty.");
        if (!email.includes("@")) 
            return setError("Invalid email format.");
        if (displayName === "") 
            return setError("Please enter a valid display name.");
        if (password === "")
            return setError("Password cannot be empty.");
        if (password !== confirmPassword) 
            return setError("Passwords do not match.");
        if ([firstName, lastName, displayName, email].some(term => password.includes(term)))
            return setError("Password cannot contain your name, display name, or email.");
        var res;
        try {
            res = await axios.post("http://localhost:8000/register", { firstName, lastName, email, displayName, password }, {withCredentials: true})
            if (res.status === 201) {
                navigate("/"); //back to welcome
            } else {
                return setError(res.data.error || "Registration failed.");
            }
        } catch (err) {
            return setError(err.response.data.error);
        }        
    };

    return (
        <form className="create-page" onSubmit={validateAndSubmit}>
          <h2>Create Account</h2>
          <p style={{marginLeft: "15px" , color: "red", fontSize: "14px"}}>All fields are mandatory</p>
          {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}
      
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            onChange={handleChange}
            className="entryfield"
            />
            <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            onChange={handleChange}
            className="entryfield"
            style={{ marginTop: "10px" }}
            />
            <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="entryfield"
            style={{ marginTop: "10px" }}
            />
            <input
            type="text"
            name="displayName"
            placeholder="Display Name"
            onChange={handleChange}
            className="entryfield"
            style={{ marginTop: "10px" }}
            />
            <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            className="entryfield"
            style={{ marginTop: "10px" }}
            />
            <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            onChange={handleChange}
            className="entryfield"
            style={{ marginTop: "10px" }}
            />

      
          <input type="submit" className="submit-button" value="Sign Up" />
        </form>
      );      
      
}