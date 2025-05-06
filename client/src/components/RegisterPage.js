import {useState} from "react"
import { useNavigate } from "react-router-dom";
import { registerUser } from "./Api";
import "../stylesheets/forms.css";

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
        if (!email.includes("@")) return setError("Invalid email format.");
        if (password !== confirmPassword) return setError("Passwords do not match.");
        if ([firstName, lastName, displayName, email].some(term => password.includes(term)))
            return setError("Password cannot contain your name, display name, or email.");

        try {
            const response = await registerUser({ firstName, lastName, email, displayName, password });
            const result = await response.json();
        
            if (response.ok) {
                navigate("/"); //back to welcome
            } else {
                setError(result.error || "Registration failed.");
            }
        } catch (err) {
            setError("Server error.");
        }        
    };

    return (
        <form className="create-page" onSubmit={validateAndSubmit}>
          <h2>Create Account</h2>
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