const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
let db = null;

app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Database error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBandServer();

//Get Players API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT player_id as playerId, player_name as playerName
        FROM player_details
        ORDER BY player_id;
    `;

  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray);
});

//Get Player API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
        SELECT player_id as playerId, player_name as playerName
        FROM player_details
        WHERE player_id = ${playerId};
    `;
  const playerArray = await db.get(getPlayerQuery);
  response.send(playerArray);
});

//Update Player API
app.put("/players/:playerId/", async (request, response) => {
  const playerDetails = request.body;
  const { playerId } = request.params;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
        UPDATE player_details
        SET player_name = '${playerName}'
        WHERE player_id = ${playerId};
    `;
  console.log(playerDetails);
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Get Match API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
        SELECT match_id as matchId, match, year
        FROM match_details
        WHERE match_id = ${matchId};
    `;
  const matchArray = await db.get(getMatchQuery);
  response.send(matchArray);
});

//Get Player's Matches Details
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
        SELECT match_details.match_id as matchId, match_details.match, match_details.year
        FROM match_details INNER JOIN player_match_score
            ON match_details.match_id = player_match_score.match_id
        WHERE player_match_score.player_id = ${playerId};
    `;

  const matchDetailsArray = await db.all(getPlayerMatchesQuery);
  response.send(matchDetailsArray);
});

//Get Match's Players Details API
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
        SELECT player_details.player_id as playerId, player_details.player_name as playerName
        FROM player_details INNER JOIN player_match_score
            ON player_details.player_id = player_match_score.player_id
        WHERE player_match_score.match_id = ${matchId};
    `;

  const playerDetailsArray = await db.all(getMatchPlayersQuery);
  response.send(playerDetailsArray);
});

//Get Player's Scores API
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoresQuery = `
        SELECT player_details.player_id as playerId, player_details.player_name as playerName,
           SUM(player_match_score.score) AS totalScore,
            SUM(fours) AS totalFours,
            SUM(sixes) AS totalSixes 
        FROM player_details INNER JOIN player_match_score ON
        player_details.player_id = player_match_score.player_id
        WHERE player_details.player_id = ${playerId};
    `;

  const playerScoresArray = await db.get(getPlayerScoresQuery);
  response.send(playerScoresArray);
});

module.exports = app;
