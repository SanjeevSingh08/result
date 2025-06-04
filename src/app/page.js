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
          teamId: result.teamId
        };
      }
      teamResults[result.teamName].totalScore += result.score;
      teamResults[result.teamName].matches += 1;
    });

    // Convert to array and sort by total score
    const sortedResults = Object.entries(teamResults)
      .map(([teamName, data]) => ({
        teamName,
        ...data
      }))
      .sort((a, b) => b.totalScore - a.totalScore);

    setResults(sortedResults);
    setLoading(false);
  };

  const exportToExcel = () => {
    let csv = "Team Name,Total Score,Matches Played\n";
    results.forEach(team => {
      csv += `${team.teamName},${team.totalScore},${team.matches}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'tournament_results.csv';
    link.click();
  };

  return (
    <div className="min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Tournament Results Calculator</h1>
        
        <div className="mb-8">
          <textarea 
            className="w-full h-48 p-4 border rounded-lg"
            placeholder="Paste tournament details here..."
            value={tournamentLinks}
            onChange={(e) => setTournamentLinks(e.target.value)}
          />
          <button
            onClick={() => fetchTournamentResults(extractTournamentIds(tournamentLinks))}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Calculating...' : 'Calculate Results'}
          </button>
        </div>

        {results.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Results</h2>
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Export to Excel
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-left">Rank</th>
                    <th className="p-3 text-left">Team Name</th>
                    <th className="p-3 text-left">Total Score</th>
                    <th className="p-3 text-left">Matches</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((team, index) => (
                    <tr key={team.teamId} className="border-b">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{team.teamName}</td>
                      <td className="p-3">{team.totalScore}</td>
                      <td className="p-3">{team.matches}</td>
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
