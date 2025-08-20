import { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";

export default function Home() {
  const [matches, setMatches] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    filterMatches();
  }, [search, filter, matches]);

  const fetchMatches = async () => {
    try {
      const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard");
      const data = await res.json();
      const events = data.events || [];

      const mapped = events.map((event, i) => {
        const competition = event.competitions[0];
        return {
          id: event.id,
          league: event.league.name,
          home: competition.competitors.find(c => c.homeAway === "home")?.team?.shortDisplayName || "TBD",
          away: competition.competitors.find(c => c.homeAway === "away")?.team?.shortDisplayName || "TBD",
          start: new Date(event.date),
        };
      });

      setMatches(mapped);
    } catch (err) {
      console.error("Error fetching matches:", err);
    }
  };

  const filterMatches = () => {
    const now = new Date();
    const filteredMatches = matches.filter((match) => {
      const matchStr = `${match.home} ${match.away} ${match.league}`.toLowerCase();
      const matchesSearch = matchStr.includes(search.toLowerCase());

      if (filter === "live") return matchesSearch && match.start <= now;
      if (filter === "upcoming") return matchesSearch && match.start > now;
      return matchesSearch;
    });

    setFiltered(filteredMatches);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>🏆 ESPN Soccer Matches</header>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search team or league..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => setFilter("all")}>All</button>
        <button onClick={() => setFilter("live")}>Live</button>
        <button onClick={() => setFilter("upcoming")}>Upcoming</button>
      </div>

      <div className={styles.matchList}>
        {filtered.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = match.start - now;

      if (diff <= 0) {
        setTimeLeft("Live Now");
        clearInterval(interval);
      } else {
        const hrs = Math.floor(diff / 1000 / 60 / 60);
        const mins = Math.floor((diff / 1000 / 60) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        setTimeLeft(`Starts in: ${hrs}h ${mins}m ${secs}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [match.start]);

  return (
    <div className={styles.match}>
      <div className={styles.teams}>
        {match.home} <span>vs</span> {match.away}
      </div>
      <div className={styles.time}>Kick-off: {match.start.toLocaleString()}</div>
      <div className={styles.countdown}>{timeLeft}</div>
    </div>
  );
}
