import React, { useState } from "react";
import styled from "styled-components";
import { WaveInput, GradientButton } from "./Design";

const JsonIT = () => {
  const [logs, setLogs] = useState("");
  const [jsonOutput, setJsonOutput] = useState(null);
  const [activeTab, setActiveTab] = useState("input");
  const [copied, setCopied] = useState(false);
  const [formatType, setFormatType] = useState("FOS");
  const [manualInputs, setManualInputs] = useState({
    bid_id: "",
    ad_id: "",
    start_time: "",
    end_time: "",
    test_case: "",
    pfm: "",
    time_zone: "",
  });

  const formatTimestamp = (ts) => {
    const d = new Date(ts);
    return isNaN(d) ? "" : d.toISOString().split(".")[0];
  };

  const safeJsonParse = (str) => {
    if (!str) return null;
    try { return JSON.parse(str); } catch {}
    try { return JSON.parse(str.replace(/\\"/g, '"')); } catch {}
    try { return JSON.parse(str.replace(/\\\\/g, "\\")); } catch {}
    return null;
  };

  // Enhanced function to extract values from logs with escaped JSON
  const extractValueFromLogs = (logString, key) => {
    try {
      let adDataValue;
      
      if (logString.trim().startsWith('{')) {
        // If it's JSON format
        const logObj = JSON.parse(logString);
        adDataValue = logObj.adData;
      } else {
        // If it's a plain log line, extract adData using regex
        const adDataMatch = logString.match(/adData="([^"]+)"/);
        if (adDataMatch) {
          adDataValue = adDataMatch[1];
        }
      }
      
      if (!adDataValue) {
        return null;
      }
      
      // The adData contains escaped JSON, so we need to unescape it
      const unescapedAdData = adDataValue
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
      
      // Parse the unescaped JSON
      const adDataObj = JSON.parse(unescapedAdData);
      
      // Navigate through the nested structure to find the key
      function findValueByKey(obj, targetKey) {
        if (typeof obj !== 'object' || obj === null) {
          return null;
        }
        
        // Check if the key exists at current level
        if (obj.hasOwnProperty(targetKey)) {
          return obj[targetKey];
        }
        
        // Recursively search in nested objects
        for (let prop in obj) {
          if (typeof obj[prop] === 'object') {
            const result = findValueByKey(obj[prop], targetKey);
            if (result !== null) {
              return result;
            }
          }
        }
        
        return null;
      }
      
      const value = findValueByKey(adDataObj, key);
      return value;
      
    } catch (error) {
      return null;
    }
  };

  /** ---- Parse a single Vega line ---- */
  function parseVegaLine(line) {
    // Check if line contains timestamp (either quoted or unquoted)
    let timeMatch = line.match(/^"?(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
    if (!timeMatch) {
      // Try alternative timestamp format
      timeMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+\d{4})/);
      if (timeMatch) {
        // Convert to ISO format
        const isoTime = timeMatch[1].replace(/\+\d{4}$/, '');
        timeMatch[1] = isoTime.split('.')[0];
      }
    }
    if (!timeMatch) return null;
    const startTime = timeMatch[1];

    // Initialize variables for extraction
    let bidId = "-";
    let adId = "-";

    // Try enhanced extraction first for escaped JSON in adData
    const extractedBidId = extractValueFromLogs(line, 'bidId');
    const extractedAdId = extractValueFromLogs(line, 'adId');
    
    if (extractedBidId) bidId = extractedBidId;
    if (extractedAdId) adId = extractedAdId;

    // If enhanced extraction didn't work, try traditional parsing
    if (bidId === "-" || adId === "-") {
      // key=value pairs parsing
      const rest = line.replace(/^"?[^"]*"?:\s*/, "");
      const parts = rest.match(/(?:[^\s,"]+|"[^"]*")+/g) || [];
      const kv = {};
      
      parts.forEach((p) => {
        const m = p.match(/^([^=]+)=(.*)$/);
        if (m) {
          const key = m[1].trim();
          let val = m[2].trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          kv[key] = val;
        }
      });

      // Try to parse adData if available
      if (kv.adData && (bidId === "-" || adId === "-")) {
        try {
          // Handle multiple levels of escaping
          let unescapedData = kv.adData;
          unescapedData = unescapedData.replace(/\\"/g, '"');
          unescapedData = unescapedData.replace(/\\\\/g, '\\');
          
          const adJson = JSON.parse(unescapedData);
          
          if (bidId === "-" && adJson?.bidAttributes?.bidId) {
            bidId = adJson.bidAttributes.bidId;
          }
          if (adId === "-" && adJson?.bidAttributes?.adId) {
            adId = adJson.bidAttributes.adId;
          }
        } catch (e) {
          // Fallback to regex extraction if JSON parsing fails
          if (bidId === "-") {
            const bidMatch = kv.adData.match(/bidId["\\']*:\s*["\\']*([^"\\',}]+)/i);
            if (bidMatch) bidId = bidMatch[1];
          }
          if (adId === "-") {
            const adMatch = kv.adData.match(/adId["\\']*:\s*["\\']*([^"\\',}]+)/i);
            if (adMatch) adId = adMatch[1];
          }
        }
      }
    }
    
    // Additional fallback: direct regex search in the entire line
    if (bidId === "-") {
      const bidMatch = line.match(/bidId["\\']*:\s*["\\']*([^"\\',}\s]+)/i);
      if (bidMatch) bidId = bidMatch[1];
    }
    if (adId === "-") {
      const adMatch = line.match(/adId["\\']*:\s*["\\']*([^"\\',}\s]+)/i);
      if (adMatch) adId = adMatch[1];
    }
    
    if (bidId === "-" && adId === "-") return null;

    // Calculate end time (10 minutes after start)
    const startDate = new Date(startTime + 'Z'); // Add Z to ensure UTC parsing
    const end = new Date(startDate.getTime() + (10 * 60 * 1000)); // Add 10 minutes in milliseconds

    return {
      ad_id: adId,
      bid_id: bidId,
      end_time: formatTimestamp(end),
      pfm: "-",
      start_time: startTime,
      test_case: "",
      time_zone: "-",
    };
  }

  /** ---- Extract blocks depending on selected format ---- */
  const extractBlocks = (content) => {
    const blocks = [];
    const seen = new Set();
    const lines = content.split(/\r?\n/);

    if (formatType === "Vega") {
      // Only look for Vega lines
      lines.forEach((line) => {
        const vega = parseVegaLine(line);
        if (vega && !seen.has(vega.bid_id)) {
          seen.add(vega.bid_id);
          blocks.push(vega);
        }
      });
      return blocks;
    }

    // ---------- FOS parsing ----------
    lines.forEach((line) => {
      const idx = line.indexOf("{");
      if (idx === -1) return;
      const jsonStr = line.slice(idx);
      let parsed = safeJsonParse(jsonStr);
      if (!parsed) return;

      if (parsed.event && typeof parsed.event === "string") {
        const inner = safeJsonParse(parsed.event);
        if (inner) parsed = inner;
      }

      const block = {
        bid_id: "-",
        ad_id: "-",
        start_time: "",
        end_time: "",
        test_case: "",
        pfm: "-",
        time_zone: "-",
      };

      const rep = parsed.reportingMetadata && safeJsonParse(parsed.reportingMetadata);
      if (rep?.bidAttributes) {
        block.bid_id = rep.bidAttributes.bidId || "-";
        block.ad_id = rep.bidAttributes.adId || "-";
      }
      if (parsed.bidAttributes) {
        block.bid_id = parsed.bidAttributes.bidId || block.bid_id;
        block.ad_id = parsed.bidAttributes.adId || block.ad_id;
      }

      const relaxed = line.replace(/\\"/g, '"');
      if (block.bid_id === "-") {
        const m = relaxed.match(/"bidId"\s*:\s*"([^"]+)"/i);
        if (m) block.bid_id = m[1];
        
        // Enhanced extraction for escaped JSON
        if (block.bid_id === "-") {
          const extractedBidId = extractValueFromLogs(line, 'bidId');
          if (extractedBidId) block.bid_id = extractedBidId;
        }
      }
      if (block.ad_id === "-") {
        const m = relaxed.match(/"adId"\s*:\s*"([^"]+)"/i);
        if (m) block.ad_id = m[1];
        
        // Enhanced extraction for escaped JSON
        if (block.ad_id === "-") {
          const extractedAdId = extractValueFromLogs(line, 'adId');
          if (extractedAdId) block.ad_id = extractedAdId;
        }
      }

      if (!block.bid_id || block.bid_id === "-" || seen.has(block.bid_id)) return;
      seen.add(block.bid_id);

      const prefix = line.match(/^(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
      const sourceTs = parsed.timestamp ?? parsed.cev_timestamp ?? parsed.eventTimestamp;
      if (prefix && sourceTs) {
        const base = new Date(String(sourceTs).replace("+0000", "Z"));
        if (!isNaN(base)) {
          const yyyy = base.getUTCFullYear();
          const mm = String(base.getUTCMonth() + 1).padStart(2, "0");
          const dd = String(base.getUTCDate()).padStart(2, "0");
          const hh = prefix[3];
          const mi = prefix[4];
          const ss = prefix[5];
          block.start_time = `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
          const end = new Date(`${block.start_time}Z`);
          if (!isNaN(end)) {
            end.setUTCMinutes(end.getUTCMinutes() + 10);
            block.end_time = end.toISOString().split(".")[0];
          }
        }
      }

      block.pfm =
        parsed.deviceAttributes?.cor ||
        parsed.deviceAttributes?.pfm ||
        "-";
      const tz =
        parsed.deviceAttributes?.deviceLocalTime ||
        parsed.deviceLocalTime ||
        "-";
      block.time_zone = typeof tz === "string" ? tz.replace(/\\/g, "") : tz;

      blocks.push(block);
    });

    return blocks;
  };

  const addValuesToAllBlocks = (blocks) =>
    blocks.map((block) => {
      const updated = { ...block };
      Object.keys(manualInputs).forEach((key) => {
        if (manualInputs[key]) {
          if (key === "start_time" && /^\d+$/.test(manualInputs.start_time)) {
            const d = new Date(Number(manualInputs.start_time));
            updated.start_time = formatTimestamp(d);
            const end = new Date(d);
            end.setMinutes(end.getMinutes() + 10);
            updated.end_time = formatTimestamp(end);
          } else {
            updated[key] = manualInputs[key];
          }
        }
      });
      return updated;
    });

  const generateJson = () => {
    let blocks = extractBlocks(logs);
    if (!blocks.length) {
      blocks = [{
        bid_id: "-",
        ad_id: "-",
        start_time: "",
        end_time: "",
        test_case: "",
        pfm: "-",
        time_zone: "-",
      }];
    }

    blocks = addValuesToAllBlocks(blocks);

    let output;
    if (formatType === "Vega") {
      // Vega format: data array at top level
      output = {
        data: blocks,
        execution_timeout: 90,
        requester: "fameqa-automation-reports@amazon.com",
      };
    } else {
      // FOS format: original structure
      output = {
        requester: "fameqa-automation-reports@amazon.com",
        execution_timeout: 90,
        data: blocks,
      };
    }
    
    setJsonOutput(output);
    setActiveTab("output");
  };

  const handleCopy = () => {
    if (!jsonOutput) return;
    navigator.clipboard
      .writeText(JSON.stringify(jsonOutput, null, 2))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-md p-4 overflow-auto">
        <h2 className="text-lg font-bold mb-4">Controls</h2>

        <StyledWrapper>
          <button onClick={generateJson}>Generate JSON</button>
        </StyledWrapper>

        <div className="mt-4 mb-4">
          <label className="block mb-1 font-semibold">Output Format:</label>
          <label className="block">
            <input
              type="radio"
              name="format"
              value="FOS"
              checked={formatType === "FOS"}
              onChange={() => setFormatType("FOS")}
            /> FOS
          </label>
          <label className="block">
            <input
              type="radio"
              name="format"
              value="Vega"
              checked={formatType === "Vega"}
              onChange={() => setFormatType("Vega")}
            /> Vega
          </label>
        </div>

        <h3 className="font-semibold mb-2">Manual Inputs</h3>
        {Object.keys(manualInputs).map((key) => (
          <WaveInput
            key={key}
            label={key}
            name={key}
            value={manualInputs[key]}
            onChange={(e) =>
              setManualInputs({ ...manualInputs, [key]: e.target.value })
            }
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex gap-2 border-b p-2">
          <GradientButton
            onClick={() => setActiveTab("input")}
            active={activeTab === "input"}
          >
            Input Logs
          </GradientButton>
          <GradientButton
            onClick={() => setActiveTab("output")}
            active={activeTab === "output"}
          >
            JSON Output
          </GradientButton>
        </div>

        <div className="flex-1 p-4 overflow-auto">
          {activeTab === "input" ? (
            <textarea
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              placeholder="Paste your logs here"
              className="w-full h-full border rounded p-2"
            />
          ) : (
            <div className="relative h-full">
              <pre className="bg-gray-800 text-green-400 p-4 rounded h-full overflow-auto">
                {jsonOutput
                  ? JSON.stringify(jsonOutput, null, 2)
                  : "No JSON generated yet."}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StyledWrapper = styled.div`
  button {
    width: 9em;
    height: 3em;
    border-radius: 30em;
    font-size: 15px;
    font-family: inherit;
    border: none;
    position: relative;
    overflow: hidden;
    z-index: 1;
    box-shadow: 6px 6px 12px #c5c5c5,
                -6px -6px 12px #ffffff;
  }
  button::before {
    content: '';
    width: 0;
    height: 3em;
    border-radius: 30em;
    position: absolute;
    top: 0;
    left: 0;
    background-image: linear-gradient(to right, #0fd850 0%, #f9f047 100%);
    transition: .5s ease;
    display: block;
    z-index: -1;
  }
  button:hover::before {
    width: 9em;
  }
`;

export default JsonIT;