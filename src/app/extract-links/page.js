"use client";
import { useState } from "react";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ExtractLinks() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("first");

  const fetchTournaments = async () => {
    setLoading(true);
    setError(null);
    try {
      const size =
        selectedDate === new Date().toISOString().split("T")[0] ? "50" : "100";

      const urls = [
        `https://api.battlexo.com/api/v1/core/tournament?status=upcoming&tournamentType=Prize+Pool&gameId=3&size=${size}&page=0`,
        `https://api.battlexo.com/api/v1/core/tournament?status=live&tournamentType=Prize+Pool&gameId=3&size=${size}&page=0`,
        `https://api.battlexo.com/api/v1/core/tournament?status=completed&tournamentType=Prize+Pool&gameId=3&size=${size}&page=0`,
      ];

      const responses = await Promise.all(urls.map((url) => fetch(url)));
      const data = await Promise.all(responses.map((res) => res.json()));

      const allTournaments = data.flatMap(
        (response) => response.data?.tournaments || []
      );

      const deathmateTournaments = allTournaments.filter(
        (tournament) => tournament.space?.name === "DeathMate Esports"
      );

      // Filter by selected date and time slot
      const filteredTournaments = deathmateTournaments.filter((tournament) => {
        const tournamentDate = new Date(tournament.startDate);
        const selectedDateTime = new Date(selectedDate);

        if (tournamentDate.getHours() < 1) {
          tournamentDate.setDate(tournamentDate.getDate() - 1);
        }

        if (selectedDateTime.toDateString() === tournamentDate.toDateString()) {
          if (selectedSlot === "all") return true;

          const hours = tournamentDate.getHours();
          const minutes = tournamentDate.getMinutes();
          const timeInMinutes = hours * 60 + minutes;

          if (selectedSlot === "first") {
            return timeInMinutes >= 790 && timeInMinutes <= 990;
          } else if (selectedSlot === "second") {
            return timeInMinutes >= 1030 && timeInMinutes <= 1230;
          } else {
            return timeInMinutes >= 1270 || timeInMinutes <= 30;
          }
        }
        return false;
      });

      filteredTournaments.sort((a, b) => {
        const timeA = new Date(a.startDate);
        const timeB = new Date(b.startDate);
        const minutesA = timeA.getHours() * 60 + timeA.getMinutes();
        const minutesB = timeB.getHours() * 60 + timeB.getMinutes();

        if (
          (minutesA < 60 && minutesB > 60) ||
          (minutesB < 60 && minutesA > 60)
        ) {
          return minutesA < 60 ? 1 : -1;
        }

        return minutesA - minutesB;
      });

      setTournaments(filteredTournaments);
    } catch (err) {
      setError("Failed to fetch tournaments. Please try again.");
      toast.error("Failed to fetch tournaments. Please try again.");
      console.error("Error fetching tournaments:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const generateFormattedText = () => {
    const getTimeRange = () => {
      switch (selectedSlot) {
        case "first":
          return "01:10 PM - 04:30 PM";
        case "second":
          return "05:10 PM - 08:30 PM";
        case "third":
          return "09:10 PM - 12:30 AM";
        case "all":
          return "ALL SLOTS";
        default:
          return "";
      }
    };

    const text = `🇮🇳 DEATHMATE ESPORTS 🇮🇳
🧡 COMPETITIVE SCRIMS 🧡

MATCH TIME : ${getTimeRange()}

🔰 PRIZEPOOL - 600 XO POINTS
🔰 ADVANCE ROOMS 🔥
🔰 PP DISTRIBUTION 👇
#1 - 300 POINTS
#2 - 200 POINTS
#3 - 100 POINTS
🔰 XO POINTS CAN BE REDEEMED IN XO SHOP FOR BGMI UC & GIFTCARDS
━━━━━━━━━━━━━━━━━━━━
${tournaments
  .map(
    (t) =>
      `${formatTime(t.startDate)} : https://www.battlexo.com/tournaments/${
        t.id
      }`
  )
  .join("\n\n")}`;

    return text;
  };

  const copyToClipboard = () => {
    const text = generateFormattedText();
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <ToastContainer position="top-center" theme="dark" />
      <main className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Extract Tournament Links
          </h1>
          <div className="flex gap-4">
            <Link
              href="/result-generator"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-purple-500/25 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Result Generator</span>
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-purple-500/25 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-xl">←</span>
              <span>Back to Home</span>
            </Link>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-purple-500/20 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-3 rounded-xl bg-gray-700 text-white border-2 border-purple-500/30 focus:border-purple-500 outline-none transition-all duration-300 cursor-pointer hover:border-purple-500/50"
            >
              <option value="">Select Date</option>
              <option value={new Date().toISOString().split("T")[0]}>
                Today
              </option>
              <option
                value={
                  new Date(Date.now() - 86400000).toISOString().split("T")[0]
                }
              >
                Yesterday
              </option>
            </select>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="p-3 rounded-xl bg-gray-700 text-white border-2 border-purple-500/30 focus:border-purple-500 outline-none transition-all duration-300 cursor-pointer hover:border-purple-500/50"
            >
              <option value="all">All Slots</option>
              <option value="first">Slot 1 (1:10 PM - 4:30 PM)</option>
              <option value="second">Slot 2 (5:10 PM - 8:30 PM)</option>
              <option value="third">Slot 3 (9:10 PM - 12:30 AM)</option>
            </select>
            <button
              onClick={fetchTournaments}
              disabled={loading || !selectedDate}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                loading || !selectedDate
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              <span className="text-white font-semibold">
                {loading ? "Fetching..." : "Fetch Tournaments"}
              </span>
            </button>
          </div>

          {tournaments.length > 0 && (
            <button
              onClick={copyToClipboard}
              className="w-full px-6 py-4 rounded-xl text-white font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Copy Formatted Text
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-900/50 border-2 border-red-500/50 text-red-200 px-6 py-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {tournaments.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-purple-500/20">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-200">
              {generateFormattedText()}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
