"use client";
import { useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ResultGenerator() {
  const [tournamentLinks, setTournamentLinks] = useState("");
  const [previousDayFile, setPreviousDayFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("totalScore");
  const [previousTotals, setPreviousTotals] = useState({});

  // Helper to normalize team names (case-insensitive, trimmed)
  const normalizeName = (name) => (name || "").trim().toLowerCase();

  const extractTournamentIds = (text) => {
    const regex = /battlexo\.com\/tournaments\/([a-f0-9]+)/g;
    const matches = [...text.matchAll(regex)];
    return matches.map((match) => match[1]);
  };

  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: 0 });
          const teamMap = {};
          jsonData.forEach((row) => {
            const teamName = (row["Team Name"] || row["teamName"] || "").trim();
            if (!teamName) return;
            const key = normalizeName(teamName);
            teamMap[key] = {
              teamName,
              totalScore: Number(row["Total Score"] || 0),
              totalMatches: Number(row["Total Matches"] || 0),
            };
          });
          resolve(teamMap);
        } catch (error) {
          reject(error);
          toast.error("Error reading Excel file");
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setPreviousDayFile(file);
      try {
        const teamMap = await parseExcelFile(file);
        setPreviousTotals(teamMap);
        toast.success("Previous results loaded successfully");
      } catch (error) {
        console.error("Error reading Excel file:", error);
        toast.error("Error reading Excel file. Please check the format.");
      }
    }
  };

  const fetchTournamentResults = async (ids) => {
    if (!ids.length) {
      toast.error("Please paste tournament links first");
      return;
    }
    setLoading(true);
    let allResults = [];
    let failedFetches = 0;
    for (const id of ids) {
      try {
        const response = await fetch(
          `https://api.battlexo.com/api/v1/core/tournament/result/${id}`
        );
        const data = await response.json();
        if (data.status === 1 && data.data.tournamentResult) {
          data.data.tournamentResult.forEach((round) => {
            round.result.forEach((group) => {
              allResults.push(...group.result);
            });
          });
        }
      } catch (error) {
        failedFetches++;
        toast.error(`Failed to fetch tournament ${id}`);
      }
    }
    if (failedFetches === ids.length) {
      toast.error("Failed to fetch any tournament results");
      setLoading(false);
      return;
    }
    // AGGREGATE BY TEAM NAME (case-insensitive, trimmed, unicode normalized)
    const teamDayResults = {};
    allResults.forEach((result) => {
      const teamName = (result.teamName || "").trim();
      if (!teamName) return;
      const key = teamName.normalize("NFKC").toLowerCase();
      if (!teamDayResults[key]) {
        teamDayResults[key] = {
          teamName, // store the first encountered original name
          totalScore: 0,
          totalMatches: 0,
        };
      }
      teamDayResults[key].totalScore += Number(result.score) || 0;
      teamDayResults[key].totalMatches += 1;
    });
    // MERGE with previousTotals if any (by teamName)
    let merged = { ...previousTotals };
    Object.entries(teamDayResults).forEach(([key, data]) => {
      if (!merged[key]) {
        merged[key] = {
          teamName: data.teamName,
          totalScore: 0,
          totalMatches: 0,
        };
      }
      merged[key].totalScore += data.totalScore;
      merged[key].totalMatches += data.totalMatches;
    });
    // Ensure teams from previous file but not today are included
    Object.keys(merged).forEach((key) => {
      if (!teamDayResults[key]) {
        merged[key].totalScore = merged[key].totalScore || 0;
        merged[key].totalMatches = merged[key].totalMatches || 0;
      }
    });
    // Sort results
    const sortedResults = Object.values(merged).sort(
      (a, b) => b[sortBy] - a[sortBy]
    );
    setResults(sortedResults);
    setLoading(false);
    toast.success("Results calculated successfully");
  };

  const exportToExcel = () => {
    const today = new Date().toISOString().split("T")[0];
    const wsData = [];
    // Create header row
    const header = ["Rank", "Team Name", "Total Score", "Total Matches"];
    wsData.push(header);
    // Add data rows
    results.forEach((team, idx) => {
      const row = [idx + 1, team.teamName, team.totalScore, team.totalMatches];
      wsData.push(row);
    });
    // Create and download Excel file
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, `tournament_results_${today}.xlsx`);
    toast.success("Results exported successfully");
  };

  const handleSort = (criteria) => {
    setSortBy(criteria);
    setResults([...results].sort((a, b) => b[criteria] - a[criteria]));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <ToastContainer position="top-center" theme="dark" />
      <main className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Result Generator</h1>
          <Link href="/" className="text-white hover:text-purple-300">
            ← Back to Home
          </Link>
        </div>
        <div className="mb-8 bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-purple-500/20">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Previous Results (Excel file, optional)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="block w-full text-gray-300
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-purple-500/20 file:text-purple-300
                  hover:file:bg-purple-500/30"
              />
              {previousDayFile && (
                <span className="text-sm text-gray-300">
                  {previousDayFile.name}
                </span>
              )}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tournament Links
            </label>
            <textarea
              className="w-full h-48 p-4 rounded-lg bg-gray-700 text-white border-2 border-purple-500/30 focus:border-purple-500 outline-none"
              placeholder="Paste tournament links here (e.g., battlexo.com/tournaments/abc123)..."
              value={tournamentLinks}
              onChange={(e) => setTournamentLinks(e.target.value)}
            />
          </div>
          <button
            onClick={() =>
              fetchTournamentResults(extractTournamentIds(tournamentLinks))
            }
            className={`mt-4 px-8 py-3 rounded-lg text-white font-medium transition duration-200 ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 hover:shadow-lg transform hover:-translate-y-0.5"
            }`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Calculating...
              </span>
            ) : (
              "Calculate Results"
            )}
          </button>
        </div>
        {results.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-purple-500/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-white">
                Tournament Results
              </h2>
              <div className="flex gap-4">
                <select
                  className="px-4 py-2 rounded-lg bg-gray-700 text-white border-2 border-purple-500/30 focus:border-purple-500 outline-none"
                  value={sortBy}
                  onChange={(e) => handleSort(e.target.value)}
                >
                  <option value="totalScore">Sort by Total Score</option>
                  <option value="totalMatches">Sort by Total Matches</option>
                </select>
                <button
                  onClick={exportToExcel}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Export to Excel
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-700/50">
                    <th className="p-4 text-left font-semibold text-white rounded-tl-lg">
                      Rank
                    </th>
                    <th className="p-4 text-left font-semibold text-white min-w-[200px]">
                      Team Name
                    </th>
                    <th className="p-4 text-left font-semibold text-white min-w-[150px]">
                      Total Score
                    </th>
                    <th className="p-4 text-left font-semibold text-white min-w-[150px] rounded-tr-lg">
                      Total Matches
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((team, index) => (
                    <tr
                      key={team.teamName + "-" + index}
                      className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition duration-150 ${
                        index === 0
                          ? "bg-yellow-500/10"
                          : index === 1
                          ? "bg-gray-700/30"
                          : index === 2
                          ? "bg-orange-500/10"
                          : ""
                      }`}
                    >
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                            index === 0
                              ? "bg-yellow-500/20 text-yellow-300"
                              : index === 1
                              ? "bg-gray-700 text-gray-300"
                              : index === 2
                              ? "bg-orange-500/20 text-orange-300"
                              : "bg-purple-500/20 text-purple-300"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-white">
                        {team.teamName}
                      </td>
                      <td className="p-4 text-white">
                        {team.totalScore.toLocaleString()}
                      </td>
                      <td className="p-4 text-white">{team.totalMatches}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
