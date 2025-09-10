import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import SmartLogSearch from "./SmartLogSearch";
import JsonIT from "./JsonIT";

export default function App() {
  return (
    <Router>
      {/* Navigation */}
      <nav className="bg-indigo-600 text-white px-6 py-3 flex gap-6 shadow-md">
        <Link to="/" className="hover:underline font-semibold">
          Smart Log Search
        </Link>
        <Link to="/jsonit" className="hover:underline font-semibold">
          JsonIT
        </Link>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<SmartLogSearch />} />
        <Route path="/jsonit" element={<JsonIT />} />
      </Routes>
    </Router>
  );
}
