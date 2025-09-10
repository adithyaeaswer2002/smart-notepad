import React, { useState } from "react";

export default function App() {
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");

  // Split logs by line instead of paragraph
  const logs = text.split(/\r?\n/).filter(line => line.trim() !== "");
  const searchWords = search.split(",").map(w => w.trim().toLowerCase()).filter(Boolean);

  const filtered = logs.filter(line =>
    searchWords.every(word => line.toLowerCase().includes(word))
  );

  const highlightText = (line) => {
    let highlighted = line;
    searchWords.forEach(word => {
      const regex = new RegExp(`(${word})`, "gi");
      highlighted = highlighted.replace(regex, `<mark class="bg-yellow-300 font-bold">$1</mark>`);
    });
    return highlighted;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <header className="bg-indigo-600 text-white w-full py-4 text-center text-2xl font-bold shadow-md">
        📝 Smart Log Search
      </header>

      <main className="max-w-6xl w-full p-6">
        {/* Search box moved above */}
        <label className="block mb-2 font-semibold">Search Keywords (comma separated)</label>
        <input
          type="text"
          className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="e.g. error, timeout, server"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <label className="block mt-4 mb-2 font-semibold">Your Logs</label>
        <textarea
          className="w-full h-48 p-3 border rounded-lg shadow-sm font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Paste your logs here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="mt-6">
          {searchWords.length > 0 && (
            <p className="text-gray-700 mb-4">
              Found <strong>{filtered.length}</strong> matching log line{filtered.length !== 1 && "s"} 
              out of {logs.length} total, containing all of: 
              <span className="text-indigo-600 font-semibold"> {searchWords.join(", ")}</span>.
            </p>
          )}

          {filtered.length > 0 ? (
            filtered.map((line, i) => (
              <pre
                key={i}
                className="bg-white p-3 mb-2 rounded-lg shadow-md font-mono text-sm whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: highlightText(line) }}
              />
            ))
          ) : (
            searchWords.length > 0 && (
              <p className="text-red-500 font-semibold">No matching log entries found.</p>
            )
          )}
        </div>
      </main>
    </div>
  );
}
