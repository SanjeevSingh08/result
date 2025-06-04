"use client";
import Image from "next/image";
import { useState } from "react";
import * as XLSX from "xlsx";
import React from "react";

export default function ResultGenerator() {
  const [tournamentLinks, setTournamentLinks] = useState("");
  const [previousDayFile, setPreviousDayFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("totalScore");
  const [currentDay, setCurrentDay] = useState(1);
  const [dayResults, setDayResults] = useState({});
  const [allDays, setAllDays] = useState([]);

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
          let days = [];
          if (jsonData.length > 0) {
            Object.keys(jsonData[0]).forEach((col) => {
              const match = col.match(/Day (\d+) Score/);
              if (match) days.push(Number(match[1]));
            });
            days = days.sort((a, b) => a - b);
          }
          jsonData.forEach((row) => {
            const teamId =
              row["Team ID"] ||
              row["teamId"] ||
              row["team_id"] ||
              row["teamid"] ||
              row["TeamId"];
            if (!teamId) return;
            teamMap[teamId] = {
              teamName: row["Team Name"] || row["teamName"] || "",
              teamId,
              days: {},
              totalScore: 0,
              totalMatches: 0,
            };
            days.forEach((day) => {
              const score = Number(row[`Day ${day} Score`] || 0);
              const matches = Number(row[`Day ${day} Matches`] || 0);
              teamMap[teamId].days[day] = { score, matches };
              teamMap[teamId].totalScore += score;
              teamMap[teamId].totalMatches += matches;
            });
          });
          resolve({ teamMap, days });
        } catch (error) {
          reject(error);
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
        const { teamMap, days } = await parseExcelFile(file);
        setDayResults(teamMap);
        setAllDays(days);
      } catch (error) {
        console.error("Error reading Excel file:", error);
        alert(
          "Error reading Excel file. Please make sure it's in the correct format."
        );
      }
    }
  };

  const fetchTournamentResults = async (ids) => {
    if (!ids.length) {
      alert("Please paste tournament links first");
      return;
    }

    setLoading(true);
    const allResults = [];

    for (const id of ids) {
      try {
        const response = await fetch(
          `https://api.battlexo.com/api/v1/core/tournament/result/${id}`
        );
        const data = await response.json();
        if (data.status === 1 && data.data.tournamentResult) {
          // Flatten all matches for this tournament
          data.data.tournamentResult.forEach((round) => {
            round.result.forEach((group) => {
              group.result.forEach((matchResult) => {
                allResults.push(matchResult);
              });
            });
          });
        }
      } catch (error) {
        console.error(`Error fetching results for tournament ${id}:`, error);
      }
    }

    // Aggregate results for the current day by teamId
    const teamResults = {};
    allResults.forEach((result) => {
      if (!result.teamId) return;
      if (!teamResults[result.teamId]) {
        teamResults[result.teamId] = {
          teamName: result.teamName,
          teamId: result.teamId,
          score: 0,
          matches: 0,
        };
      }
      teamResults[result.teamId].score += Number(result.score) || 0;
      teamResults[result.teamId].matches += 1;
    });

    // Merge with previous days (do not overwrite previous days)
    let merged = { ...dayResults };
    let days = [...allDays];
    if (!days.includes(currentDay)) days.push(currentDay);
    days = days.sort((a, b) => a - b);
    Object.entries(teamResults).forEach(([teamId, data]) => {
      if (!merged[teamId]) {
        merged[teamId] = {
          teamName: data.teamName,
          teamId,
          days: {},
          totalScore: 0,
          totalMatches: 0,
        };
      }
      merged[teamId].days = merged[teamId].days || {};
      // Only update the current day's data
      merged[teamId].days[currentDay] = {
        score: data.score,
        matches: data.matches,
      };
    });
    // For teams that did not play today, keep their previous data
    Object.values(merged).forEach((team) => {
      team.days = team.days || {};
      if (!team.days[currentDay]) {
        team.days[currentDay] = { score: 0, matches: 0 };
      }
    });
    // Recalculate totals
    Object.values(merged).forEach((team) => {
      team.totalScore = 0;
      team.totalMatches = 0;
      days.forEach((day) => {
        const d = team.days[day] || { score: 0, matches: 0 };
        team.totalScore += d.score;
        team.totalMatches += d.matches;
      });
    });
    // Prepare for table
    const sortedResults = Object.values(merged).sort(
      (a, b) => b[sortBy] - a[sortBy]
    );
    setResults(sortedResults);
    setDayResults(merged);
    setAllDays(days);
    setLoading(false);
  };

  const exportToExcel = () => {
    const today = new Date().toISOString().split("T")[0];
    const wsData = [];
    const header = ["Rank", "Team Name", "Team ID"];
    allDays.forEach((day) => {
      header.push(`Day ${day} Score`, `Day ${day} Matches`);
    });
    header.push("Total Score", "Total Matches");
    wsData.push(header);
    results.forEach((team, idx) => {
      const row = [idx + 1, team.teamName, team.teamId];
      allDays.forEach((day) => {
        const d = team.days[day] || { score: 0, matches: 0 };
        row.push(d.score, d.matches);
      });
      row.push(team.totalScore, team.totalMatches);
      wsData.push(row);
    });
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(
      workbook,
      `tournament_results_${today}_day${currentDay}.xlsx`
    );
  };

  const handleSort = (criteria) => {
    setSortBy(criteria);
    setResults([...results].sort((a, b) => b[criteria] - a[criteria]));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center text-blue-600">
          Tournament Results Calculator
        </h1>
        <p className="text-center text-gray-800 mb-8">
          Track and calculate tournament results across multiple days
        </p>

        <div className="mb-8 bg-white p-6 rounded-xl shadow-lg">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Current Day (1-7)
              </label>
              <select
                className="w-full px-4 py-2 border rounded-lg text-gray-800"
                value={currentDay}
                onChange={(e) => setCurrentDay(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <option key={day} value={day}>
                    Day {day}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentDay > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Previous Day Results (Excel file)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="block w-full text-gray-800
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                {previousDayFile && (
                  <span className="text-sm text-gray-800">
                    {previousDayFile.name}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Current Day Tournament Links
            </label>
            <textarea
              className="w-full h-48 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-800"
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
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
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
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Tournament Results (Day {currentDay})
              </h2>
              <div className="flex gap-4">
                <select
                  className="px-4 py-2 border rounded-lg text-gray-800"
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
                  <tr className="bg-gray-50">
                    <th className="p-4 text-left font-semibold text-gray-800 rounded-tl-lg">
                      Rank
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-800 min-w-[200px]">
                      Team Name
                    </th>
                    {allDays.map((day) => (
                      <th
                        key={`day-${day}`}
                        className="p-4 text-left font-semibold text-gray-800 min-w-[150px]"
                      >
                        Day {day} Score
                      </th>
                    ))}
                    <th className="p-4 text-left font-semibold text-gray-800 min-w-[150px]">
                      Total Score
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-800 min-w-[150px] rounded-tr-lg">
                      Total Matches
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((team, index) => (
                    <tr
                      key={team.teamId}
                      className={`border-b hover:bg-gray-50 transition duration-150 ${
                        index === 0
                          ? "bg-yellow-50"
                          : index === 1
                          ? "bg-gray-50"
                          : index === 2
                          ? "bg-orange-50"
                          : ""
                      }`}
                    >
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                            index === 0
                              ? "bg-yellow-100 text-black"
                              : index === 1
                              ? "bg-gray-100 text-black"
                              : index === 2
                              ? "bg-orange-100 text-black"
                              : "bg-blue-50 text-black"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-black">
                        {team.teamName}
                      </td>
                      {allDays.map((day) => (
                        <React.Fragment key={`day-${team.teamId}-${day}`}>
                          <td className="p-4 text-black">
                            {(team.days[day]?.score ?? 0).toLocaleString()}
                          </td>
                          <td className="p-4 text-black">
                            {team.days[day]?.matches ?? 0}
                          </td>
                        </React.Fragment>
                      ))}
                      <td className="p-4 text-black">
                        {team.totalScore.toLocaleString()}
                      </td>
                      <td className="p-4 text-black">{team.totalMatches}</td>
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
