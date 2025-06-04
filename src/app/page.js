"use client";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [tournamentLinks, setTournamentLinks] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const extractTournamentIds = (text) => {
    const regex = /battlexo\.com\/tournaments\/([a-f0-9]+)/g;
    const matches = [...text.matchAll(regex)];
    return matches.map(match => match[1]);
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
        const response = await fetch(`https://api.battlexo.com/api/v1/core/tournament/result/${id}`);
        const data = await response.json();
        if (data.status === 1 && data.data.tournamentResult) {
          allResults.push(...data.data.tournamentResult[0].result[0].result);
        }
      } catch (error) {
        console.error(`Error fetching results for tournament ${id}:`, error);
      }
    }

    // Aggregate results by team
    const teamResults = {};
    allResults.forEach(result => {
      if (!teamResults[result.teamName]) {
        teamResults[result.teamName] = {
          totalScore: 0,
          matches: 0,
          teamId: result.teamId,
          averageScore: 0
        };
      }
      teamResults[result.teamName].totalScore += result.score;
      teamResults[result.teamName].matches += 1;
    });

    // Calculate averages and convert to array
    const sortedResults = Object.entries(teamResults)
      .map(([teamName, data]) => ({
        teamName,
        ...data,
        averageScore: (data.totalScore / data.matches).toFixed(2)
      }))
      .sort((a, b) => b.totalScore - a.totalScore);

    setResults(sortedResults);
    setLoading(false);
  };

  const exportToExcel = () => {
    let csv = "Rank,Team Name,Total Score,Average Score,Matches Played\n";
    results.forEach((team, index) => {
      csv += `${index + 1},${team.teamName},${team.totalScore},${team.averageScore},${team.matches}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tournament_results_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Tournament Results Calculator
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Paste your tournament links below to calculate combined results
        </p>
        
        <div className="mb-8 bg-white p-6 rounded-xl shadow-lg">
          <textarea 
            className="w-full h-48 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            placeholder="Paste tournament links here (e.g., battlexo.com/tournaments/abc123)..."
            value={tournamentLinks}
            onChange={(e) => setTournamentLinks(e.target.value)}
          />
          <button
            onClick={() => fetchTournamentResults(extractTournamentIds(tournamentLinks))}
            className={`mt-4 px-8 py-3 rounded-lg text-white font-medium transition duration-200 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Calculating...
              </span>
            ) : 'Calculate Results'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Tournament Results</h2>
              <button
                onClick={exportToExcel}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Export to Excel
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-4 text-left font-semibold text-gray-600 rounded-tl-lg">Rank</th>
                    <th className="p-4 text-left font-semibold text-gray-600">Team Name</th>
                    <th className="p-4 text-left font-semibold text-gray-600">Total Score</th>
                    <th className="p-4 text-left font-semibold text-gray-600">Average Score</th>
                    <th className="p-4 text-left font-semibold text-gray-600 rounded-tr-lg">Matches</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((team, index) => (
                    <tr 
                      key={team.teamId} 
                      className={`border-b hover:bg-gray-50 transition duration-150 ${
                        index === 0 ? 'bg-yellow-50' : 
                        index === 1 ? 'bg-gray-50' :
                        index === 2 ? 'bg-orange-50' : ''
                      }`}
                    >
                      <td className="p-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-50 text-blue-800'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="p-4 font-medium">{team.teamName}</td>
                      <td className="p-4">{team.totalScore.toLocaleString()}</td>
                      <td className="p-4">{team.averageScore}</td>
                      <td className="p-4">{team.matches}</td>
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
