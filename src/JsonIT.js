import React, { useState } from "react";
import styled from 'styled-components';
import { WaveInput, GradientButton } from "./Design";



const JsonIT = () => {
  const [logs, setLogs] = useState("");
  const [jsonOutput, setJsonOutput] = useState(null);
  const [activeTab, setActiveTab] = useState("input");
  const [copied, setCopied] = useState(false);
  const [manualInputs, setManualInputs] = useState({
    bid_id: "",
    ad_id: "",
    start_time: "",
    end_time: "",
    test_case: "",
    pfm: "",
    time_zone: "",
  });

  // -------- Utility Functions --------
  const formatTimestamp = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    if (isNaN(d)) return "";
    return d.toISOString().split(".")[0];
  };

  // Safe JSON parser with retry for escaped strings
  const safeJsonParse = (str) => {
    if (!str || typeof str !== "string") return null;
    let cleaned = str;
    try {
      return JSON.parse(cleaned);
    } catch {}
    try {
      cleaned = cleaned.replace(/\\"/g, '"');
      return JSON.parse(cleaned);
    } catch {}
    try {
      cleaned = cleaned.replace(/\\\\/g, "\\");
      return JSON.parse(cleaned);
    } catch {}
    return null;
  };

  const extractBlocks = (content) => {
  const blocks = [];
  const seenBids = new Set();
  if (!content) return blocks;

  const lines = content.split(/\r?\n/);

  lines.forEach((line) => {
    const jsonStart = line.indexOf("{");
    if (jsonStart === -1) return;
    const jsonStr = line.slice(jsonStart);

    let parsed = safeJsonParse(jsonStr);
    if (!parsed) return;

    // If "event" field exists → parse inner JSON
    if (parsed.event && typeof parsed.event === "string") {
      const inner = safeJsonParse(parsed.event);
      if (inner) parsed = inner;
    }

    let block = {
      bid_id: "-",
      ad_id: "-",
      start_time: "",
      end_time: "",
      test_case: "",
      pfm: "-",
      time_zone: "-",
    };

    // ---- reportingMetadata ----
    let reporting = parsed.reportingMetadata;
    if (reporting) {
      reporting = safeJsonParse(reporting) || reporting;
    }
    if (reporting?.bidAttributes) {
      block.bid_id = reporting.bidAttributes.bidId || "-";
      block.ad_id = reporting.bidAttributes.adId || "-";
    }

    // ---- AdditionalMetadata fallback ----
    if (block.bid_id === "-" && parsed.AdditionalMetadata) {
      Object.values(parsed.AdditionalMetadata).forEach((metaStr) => {
        const metaObj = safeJsonParse(metaStr);
        if (metaObj?.bidAttributes) {
          block.bid_id = metaObj.bidAttributes.bidId || "-";
          block.ad_id = metaObj.bidAttributes.adId || "-";
        }
      });
    }

    // ---- Fallback: try top-level fields ----
    if (block.bid_id === "-") {
      if (parsed.bidId) block.bid_id = parsed.bidId;
    }
    if (block.ad_id === "-") {
      if (parsed.adId) block.ad_id = parsed.adId;
    }

    // ---- Regex fallback on relaxed string ----
    if (block.bid_id === "-" || block.ad_id === "-") {
      const relaxedLine = line.replace(/\\"/g, '"');
      if (block.bid_id === "-") {
        const regexBid = relaxedLine.match(/"bidId"\s*:\s*"([^"]+)"/i);
        if (regexBid) block.bid_id = regexBid[1];
      }
      if (block.ad_id === "-") {
        const regexAd = relaxedLine.match(/"adId"\s*:\s*"([^"]+)"/i);
        if (regexAd) block.ad_id = regexAd[1];
      }
    }

    // ---- Skip if still no bid_id ----
    if (!block.bid_id || block.bid_id === "-") return;
    if (seenBids.has(block.bid_id)) return;
    seenBids.add(block.bid_id);

    // ---- start_time from log prefix time + JSON date ----
    const prefixMatch = line.match(/^(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
    const sourceTs =
      parsed.timestamp ??
      parsed.cev_timestamp ??
      parsed.eventTimestamp;
    if (prefixMatch && sourceTs) {
      let baseDate;
      if (typeof sourceTs === "number") {
        baseDate = new Date(sourceTs > 1e12 ? sourceTs : sourceTs * 1000);
      } else if (typeof sourceTs === "string") {
        baseDate = new Date(sourceTs.replace("+0000", "Z"));
      }
      if (!isNaN(baseDate)) {
        const yyyy = baseDate.getUTCFullYear();
        const mm = String(baseDate.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(baseDate.getUTCDate()).padStart(2, "0");
        const hh = prefixMatch[3];
        const mi = prefixMatch[4];
        const ss = prefixMatch[5];
        block.start_time = `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
        const endDate = new Date(`${block.start_time}Z`);
        if (!isNaN(endDate)) {
          endDate.setUTCMinutes(endDate.getUTCMinutes() + 10);
          block.end_time = endDate.toISOString().split(".")[0];
        }
      }
    }

    // ---- pfm (prefer cor, fallback pfm) ----
    block.pfm =
      parsed.deviceAttributes?.cor ||
      parsed.deviceAttributes?.pfm ||
      "-";

    // ---- timezone ----
    let tz =
      parsed.deviceAttributes?.deviceLocalTime ||
      parsed.deviceLocalTime ||
      "-";
    tz = typeof tz === "string" ? tz.replace(/\\/g, "") : tz;
    block.time_zone = tz;

    blocks.push(block);
  });

  return blocks;
};

  const generateJson = () => {
    let blocks = extractBlocks(logs);

    if (blocks.length === 0) {
      blocks = [
        {
          bid_id: "-",
          ad_id: "-",
          start_time: "",
          end_time: "",
          test_case: "",
          pfm: "-",
          time_zone: "-",
        },
      ];
    }

    // Apply manual inputs
    blocks = addValuesToAllBlocks(blocks);

    const finalJson = {
      requester: "fameqa-automation-reports@amazon.com",
      execution_timeout: 90,
      data: blocks,
    };

    setJsonOutput(finalJson);
    setActiveTab("output");
  };

  const addValuesToAllBlocks = (blocks) => {
    return blocks.map((block) => {
      const updatedBlock = { ...block };
      Object.keys(manualInputs).forEach((key) => {
        if (manualInputs[key]) {
          if (
            key === "start_time" &&
            /^\d+$/.test(manualInputs.start_time)
          ) {
            const d = new Date(Number(manualInputs.start_time));
            updatedBlock.start_time = formatTimestamp(d);
            const end = new Date(d);
            end.setMinutes(end.getMinutes() + 10);
            updatedBlock.end_time = formatTimestamp(end);
          } else {
            updatedBlock[key] = manualInputs[key];
          }
        }
      });
      return updatedBlock;
    });
  };

  const handleCopy = () => {
    if (jsonOutput) {
      navigator.clipboard
        .writeText(JSON.stringify(jsonOutput, null, 2))
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md p-4">
        <h2 className="text-lg font-bold mb-4">Controls</h2>
        <div className="mb-4">
          <StyledWrapper>
            <button onClick={generateJson}>Generate JSON</button>
          </StyledWrapper>
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

      {/* Main Content */}
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
