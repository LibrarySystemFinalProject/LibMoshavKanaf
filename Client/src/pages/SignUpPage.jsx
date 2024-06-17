import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useUser from "../hooks/useUser";
import { signUp } from "../components/Auth";
import { auth } from "../components/FireBaseAuth";
import { FaSpinner } from "react-icons/fa";
import axios from "axios";

const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [hasClickedCreateAccount, setHasClickedCreateAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useUser();

  const createAccount = async () => {
    setIsLoading(true);
    setHasClickedCreateAccount(true);

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      setIsLoading(false);
      return;
    }

    if (displayName.length < 4 || displayName.length > 12) {
      setError("Display name must be between 4 and 12 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`/api/displaynames/${displayName}`);
      if (!response.data.valid) {
        setError("Display name is already in use.");
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error validating display name", error);
      setError("Failed to validate display name.");
      setIsLoading(false);
      return;
    }

    let result = await signUp(auth, email, password);
    if (result.status) {
      console.log("User created successfully.");
      try {
        const userResponse = await axios.put(`/api/displaynames/${result.user.uid}`, { displayName });
        if (userResponse.status === 200) {
          navigate("/");
        } else {
          setError("Failed to save display name.");
        }
      } catch (error) {
        console.error("Error updating display name", error);
        setError("Failed to update display name.");
      }
    } else {
      console.log("User creation failed:", result.message);
      setError(result.message.replace("Firebase:", "").trim());
    }
    setIsLoading(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    createAccount();
  };

  return (
    <div className="flex items-center justify-center mt-8">
      <form
        className="bg-bg-navbar-custom shadow-2xl rounded md:px-8 px-2 pt-6 pb-8 w-full sm:w-1/2 lg:w-1/3"
        onSubmit={handleSubmit}
      >
        <div className="text-center flex justify-center mb-3">
          <h1 className="text-3xl text-gray-50 font-bold mb-5">
            Create an account
          </h1>
        </div>

        <div className="border-2 bg-gray-700 rounded-lg p-4 mb-4">
          <div className="mb-4">
            <label className="block text-gray-50 text-sm mb-2">
              Email Address
            </label>
            <input
              className={
                (error === "Firebase: Error (auth/invalid-email)." ||
                  email === "") &&
                hasClickedCreateAccount
                  ? "bg-red-200 shadow appearance-none border rounded w-full py-2 px-3 text-gray-50 leading-tight focus:outline-none focus:shadow-outline"
                  : "bg-bg-navbar-custom shadow appearance-none border rounded w-full py-2 px-3 text-gray-50 leading-tight focus:outline-none focus:shadow-outline"
              }
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-gray-50 text-sm mb-2">
              Password
            </label>
            <input
              className={
                password === "" && hasClickedCreateAccount
                  ? "bg-red-200 shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-50 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                  : "bg-bg-navbar-custom shadow appearance-none border rounded w-full py-2 px-3 text-gray-50 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              }
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-gray-50 text-sm mb-2">
              Confirm Password
            </label>
            <input
              className={
                (password !== confirmPassword || confirmPassword === "") &&
                hasClickedCreateAccount
                  ? "bg-red-200 shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-50 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                  : "bg-bg-navbar-custom shadow appearance-none border rounded w-full py-2 px-3 text-gray-50 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              }
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-gray-50 text-sm mb-2">
              Display Name
            </label>
            <input
              className={
                error && error.includes("Display name")
                  ? "bg-red-200 shadow appearance-none border rounded w-full py-2 px-3 text-gray-50 leading-tight focus:outline-none focus:shadow-outline"
                  : "bg-bg-navbar-custom shadow appearance-none border rounded w-full py-2 px-3 text-gray-50 leading-tight focus:outline-none focus:shadow-outline"
              }
              placeholder="Your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between m-auto">
          {isLoading ? (
            <button
              type="button"
              className="bg-blue-400 text-gray-50 font-bold py-2 px-4 mx-auto mb-4 rounded"
              disabled
            >
              <FaSpinner className="animate-spin inline-block h-7 w-7 text-white mr-2" />
              Loading ..
            </button>
          ) : (
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-gray-50 font-bold py-2 px-4 mx-auto mb-4 rounded focus:outline-none focus:shadow-outline"
            >
              Create Account
            </button>
          )}
        </div>
        {error && hasClickedCreateAccount && (
          <p className="bg-red-100 border border-red-400 text-red-700 mb-4 px-4 py-3 rounded relative select-none hover:bg-red-200 text-center">
            {error}
          </p>
        )}

        <div className="flex flex-col items-center justify-center md:flex-row md:justify-center md:items-center space-y-4 md:space-x-4 md:space-y-0 mt-4 border-2 border-gray-600 rounded-md py-4 px-6">
          <h2 className="text-gray-50">Already have an account?</h2>
          <Link
            className="text-blue-500 rounded focus:outline-none focus:shadow-outline"
            to="/login"
          >
            Log in here
          </Link>
        </div>
      </form>
    </div>
  );
};

export default SignUpPage;
