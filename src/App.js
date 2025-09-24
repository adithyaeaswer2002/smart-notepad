import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from "react-router-dom";
import SmartLogSearch from "./SmartLogSearch";
import JsonIT from "./JsonIT";
import { ShineButton } from "./Design";
// import SplashCursor from "./Design";

function NavButtons() {
  const location = useLocation();

  return (
    <nav className="bg-indigo-600 text-white px-6 py-3 flex gap-6 shadow-md">
      <Link to="/">
        <ShineButton active={location.pathname === "/"}>SearchIT</ShineButton>
      </Link>
      <Link to="/jsonit">
        <ShineButton active={location.pathname === "/jsonit"}>JsonIT</ShineButton>
      </Link>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      {/* <SplashCursor /> */}
      <NavButtons />
      <Routes>
        <Route path="/" element={<SmartLogSearch />} />
        <Route path="/jsonit" element={<JsonIT />} />
      </Routes>
    </Router>
  );
}