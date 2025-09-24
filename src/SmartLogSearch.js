import React, { useEffect, useMemo, useState } from "react";

export default function App() {
  const [mode, setMode] = useState("paste"); // 'paste' | 'upload'
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [renderLimit, setRenderLimit] = useState(500); // limit DOM nodes for performance

  // Debounce search to avoid filtering on every keystroke for large inputs
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Parse logs only once per text change
  const logs = useMemo(
    () => text.split(/\r?\n/).filter(line => line.trim() !== ""),
    [text]
  );

  const searchWords = useMemo(
    () => debouncedSearch.split(",").map(w => w.trim().toLowerCase()).filter(Boolean),
    [debouncedSearch]
  );

  // Pre-build regexes once for highlighting
  const wordRegexes = useMemo(
    () => searchWords.map(w => new RegExp(`(${escapeRegExp(w)})`, "gi")),
    [searchWords]
  );

  // Filtering is the heavy step; useMemo + debounced search will help
  const filtered = useMemo(() => {
    if (searchWords.length === 0) return logs;
    return logs.filter(line => {
      const lower = line.toLowerCase();
      for (let i = 0; i < searchWords.length; i++) {
        if (!lower.includes(searchWords[i])) return false;
      }
      return true;
    });
  }, [logs, searchWords]);

  const filteredCount = filtered.length;
  const toRender = filtered.slice(0, renderLimit);

  const highlightText = (line) => {
    if (wordRegexes.length === 0) return line;
    let highlighted = line;
    wordRegexes.forEach(rx => {
      highlighted = highlighted.replace(rx, `<mark class="bg-yellow-300 font-bold">$1</mark>`);
    });
    return highlighted;
  };

  const onPickFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(`${f.name} (${formatBytes(f.size)})`);
    const txt = await f.text();
    setText(txt);
  };

  const switchMode = (m) => {
    setMode(m);
    if (m === "paste") {
      setFileName("");
    }
  };

  const loadMore = () => {
    setRenderLimit(prev => prev + 500);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      {/* <header className="bg-indigo-600 text-white w-full py-4 text-center text-2xl font-bold shadow-md">
        📝 Smart Log Search
      </header> */}

      <main className="max-w-6xl w-full p-6">

        {/* Top tabs: Paste / Upload */}
        <div className="mb-4">
          <div className="inline-flex rounded-lg overflow-hidden border border-gray-300 bg-white">
            <button
              onClick={() => switchMode("paste")}
              className={`px-4 py-2 text-sm font-medium ${mode === "paste" ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              Paste
            </button>
            <button
              onClick={() => switchMode("upload")}
              className={`px-4 py-2 text-sm font-medium border-l border-gray-300 ${mode === "upload" ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              Upload
            </button>
          </div>
        </div>

        {/* Input area */}
        {mode === "paste" ? (
          <>
            <label className="block mb-2 font-semibold">Your Logs</label>
            <textarea
              className="w-full h-48 p-3 border rounded-lg shadow-sm font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Paste your logs here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </>
        ) : (
          <>
            <label className="block mb-2 font-semibold">Upload Log File</label>
            <div className="w-full p-4 border-2 border-dashed rounded-lg bg-white">
              <input
                type="file"
                accept=".log,.txt,.json,.csv,*/*"
                onChange={onPickFile}
                className="block"
              />
              {fileName && (
                <p className="text-sm text-gray-600 mt-2">Loaded: <span className="font-medium">{fileName}</span></p>
              )}
            </div>
            {/* Optional: quick view text area (collapsed) */}
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-gray-600">Preview loaded content</summary>
              <textarea
                className="w-full h-40 mt-2 p-3 border rounded-lg shadow-sm font-mono text-sm"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </details>
          </>
        )}

        {/* Search */}
        <label className="block mt-6 mb-2 font-semibold">Search Keywords (comma separated)</label>
        <input
          type="text"
          className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="e.g. error, timeout, server"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Results */}
        <div className="mt-6">
          <p className="text-gray-700 mb-4">
            Showing <strong>{Math.min(toRender.length, filteredCount)}</strong> of <strong>{filteredCount}</strong> matching line{filteredCount !== 1 && "s"} out of {logs.length} total
            {searchWords.length > 0 && <> containing all of: <span className="text-indigo-600 font-semibold">{searchWords.join(", ")}</span></>}
            .
          </p>

          {toRender.length > 0 ? (
            <>
              {toRender.map((line, i) => (
                <pre
                  key={i}
                  className="bg-white p-3 mb-2 rounded-lg shadow-md font-mono text-sm whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{ __html: highlightText(line) }}
                />
              ))}
              {filteredCount > toRender.length && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={loadMore}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700"
                  >
                    Load more
                  </button>
                </div>
              )}
            </>
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

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024, dm = 1, sizes = ["B","KB","MB","GB","TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
