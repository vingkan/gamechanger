import { useState } from "react";
import { SortableJudgeScores } from "./SortableJudgeScores";
import { getRandomPrompt, type Prompt } from "./prompts";

const MAX_POINTS_BEFORE_BUST = 31;

type Player = {
  id: number;
  name: string;
  score: number;
  roundsPlayed: number;
};

function isBusted(player: Player): boolean {
  return player.score > MAX_POINTS_BEFORE_BUST;
}

function getPlayersFromLocalStorage(): Player[] {
  const raw = localStorage.getItem("gameChangerPlayers");
  try {
    return JSON.parse(raw ?? "[]") as Player[];
  } catch (error) {
    console.error(error);
    return [];
  }
}

function savePlayersToLocalStorage(players: Player[]) {
  localStorage.setItem("gameChangerPlayers", JSON.stringify(players));
}

function usePlayers() {
  const [players, setPlayers] = useState<Player[]>(() => {
    const savedPlayers = getPlayersFromLocalStorage();
    return savedPlayers;
  });

  const setAndSavePlayers = (fn: (players: Player[]) => Player[]) => {
    setPlayers((prev) => {
      const nextPlayers = fn(prev);
      savePlayersToLocalStorage(nextPlayers);
      return nextPlayers;
    });
  };

  return {
    players,
    addPlayer: () => {
      setAndSavePlayers((prev) => {
        const nextPlayerId = prev.length + 1;
        return [
          ...prev,
          {
            id: nextPlayerId,
            name: `player ${nextPlayerId}`,
            score: 0,
            roundsPlayed: 0,
          } satisfies Player,
        ];
      });
    },
    renamePlayer: (id: number, name: string) => {
      setAndSavePlayers((prev) =>
        prev.map((player) => (player.id === id ? { ...player, name } : player))
      );
    },
    removePlayer: (id: number) => {
      setAndSavePlayers((prev) => prev.filter((player) => player.id !== id));
    },
    addPointsToPlayer: (id: number, score: number) => {
      setAndSavePlayers((prev) =>
        prev.map((player) =>
          player.id === id
            ? {
                ...player,
                score: player.score + score,
                roundsPlayed: player.roundsPlayed + 1,
              }
            : player
        )
      );
    },
    removeAllPlayers: () => {
      setAndSavePlayers(() => []);
    },
  };
}

function getRandomRoundPlayerIds(players: Player[], n: number): Set<number> {
  const maxRoundsPlayed = Math.max(
    ...players.map((player) => player.roundsPlayed)
  );
  const isAllEligible = players.every(
    (player) => player.roundsPlayed === maxRoundsPlayed
  );
  const eligiblePlayers = isAllEligible
    ? players
    : players.filter((player) => player.roundsPlayed < maxRoundsPlayed);

  // Pop off a random player from the eligible players until we have n players
  // or there are no eligible players left.
  const result = new Set<number>();
  while (result.size < n && eligiblePlayers.length > 0) {
    const randomIndex = Math.floor(Math.random() * eligiblePlayers.length);
    result.add(eligiblePlayers[randomIndex].id);
    eligiblePlayers.splice(randomIndex, 1);
  }
  return result;
}

function getCurrentRoundPlayerNames(
  playerIds: Set<number>,
  players: Player[]
): string[] {
  return players
    .filter((player) => playerIds.has(player.id))
    .map((player) => player.name);
}

function formatCurrentRoundPlayerNames(playerNames: string[]): string {
  if (playerNames.length === 0) {
    return "";
  }
  if (playerNames.length === 1) {
    const [name] = playerNames;
    return name ?? "";
  }
  if (playerNames.length === 2) {
    const [first, second] = playerNames;
    return `${first} and ${second}`;
  }
  const rest = playerNames.slice(0, -1);
  const last = playerNames[playerNames.length - 1];
  return `${rest.join(", ")}, and ${last ?? ""}`;
}

function getUsedPrompts(): Set<string> {
  const raw = localStorage.getItem("gameChangerUsedPrompts");
  try {
    return new Set(JSON.parse(raw ?? "[]") as string[]);
  } catch (error) {
    console.error(error);
    return new Set();
  }
}

function saveUsedPrompts(usedPrompts: Set<string>) {
  localStorage.setItem(
    "gameChangerUsedPrompts",
    JSON.stringify(Array.from(usedPrompts))
  );
}

function useUsedPrompts() {
  const [usedPrompts, setUsedPrompts] = useState<Set<string>>(() => {
    return getUsedPrompts();
  });

  return {
    usedPrompts,
    addUsedPrompt: (promptId: string) => {
      setUsedPrompts((prev) => {
        const nextUsedPrompts = new Set(prev);
        nextUsedPrompts.add(promptId);
        saveUsedPrompts(nextUsedPrompts);
        return nextUsedPrompts;
      });
    },
    removeAllUsedPrompts: () => {
      setUsedPrompts(() => new Set());
      saveUsedPrompts(new Set());
    },
  };
}

function PlayerScoreContainer({
  player,
  renamePlayer,
  removePlayer,
}: {
  player: Player;
  renamePlayer: (name: string) => void;
  removePlayer: () => void;
}) {
  return (
    <div
      className={[
        "player-score-container",
        isBusted(player) ? "busted" : "",
      ].join(" ")}
      data-player-id={player.id}
    >
      <div className="content">
        <div
          className="name"
          onBlur={(e) => {
            const nextName = e.target.innerText.split("\n").join(" ").trim();
            if (nextName.length === 0) {
              removePlayer();
              return;
            }
            renamePlayer(nextName);
          }}
          contentEditable
          spellCheck={false}
          dangerouslySetInnerHTML={{ __html: player.name }}
        />
        <div className="score">{player.score}</div>
      </div>
      <img className="podium" src="./podium.png" />
    </div>
  );
}

type FlyingScore = {
  id: string;
  score: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

function App() {
  const {
    players,
    addPlayer,
    renamePlayer,
    removePlayer,
    addPointsToPlayer,
    removeAllPlayers,
  } = usePlayers();
  const { usedPrompts, addUsedPrompt, removeAllUsedPrompts } = useUsedPrompts();
  const [currentRoundPlayerIds, setCurrentRoundPlayerIds] = useState<
    Set<number>
  >(new Set());
  const [currentRoundPrompt, setCurrentRoundPrompt] = useState<Prompt | null>(
    null
  );
  const [flyingScores, setFlyingScores] = useState<FlyingScore[]>([]);

  const createRoundOf = (n: number) => {
    const nextRoundPlayerIds = getRandomRoundPlayerIds(
      [...players.filter((player) => !isBusted(player))],
      n
    );
    setCurrentRoundPlayerIds(nextRoundPlayerIds);
    setCurrentRoundPrompt(null);
  };

  const choosePrompt = () => {
    if (currentRoundPlayerIds.size === 0) {
      return;
    }
    const nextRoundPrompt = getRandomPrompt(
      currentRoundPlayerIds.size,
      usedPrompts
    );
    if (nextRoundPrompt === null) {
      setCurrentRoundPrompt({
        id: "no-prompt-found",
        text: `Sorry, no ${currentRoundPlayerIds.size} player prompts left :(`,
        playersNeeded: currentRoundPlayerIds.size,
      });
      return;
    }
    setCurrentRoundPrompt(nextRoundPrompt);
  };

  const finalizeRound = (score: number, sourceRect: DOMRect) => {
    if (currentRoundPrompt === null || currentRoundPlayerIds.size === 0) {
      return;
    }

    // Get positions of all player podiums for current round
    const newFlyingScores: FlyingScore[] = [];

    currentRoundPlayerIds.forEach((playerId) => {
      const playerElement = document.querySelector(
        `[data-player-id="${playerId}"]`
      );
      if (playerElement) {
        const playerRect = playerElement.getBoundingClientRect();
        // Target the score area within the player container
        const scoreElement = playerElement.querySelector(".score");
        const scoreRect = scoreElement?.getBoundingClientRect() || playerRect;

        newFlyingScores.push({
          id: `${playerId}-${Date.now()}`,
          score,
          startX: sourceRect.left + sourceRect.width / 2,
          startY: sourceRect.top + sourceRect.height / 2,
          endX: scoreRect.left + scoreRect.width / 2,
          endY: scoreRect.top + scoreRect.height / 2,
        });
      }
    });

    setFlyingScores(newFlyingScores);

    // Wait for animation to complete, then update scores
    setTimeout(() => {
      for (const playerId of currentRoundPlayerIds) {
        addPointsToPlayer(playerId, score);
      }

      addUsedPrompt(currentRoundPrompt.id);
      setCurrentRoundPlayerIds(new Set());
      setCurrentRoundPrompt(null);
      setFlyingScores([]);
    }, 1000); // Animation duration
  };

  const resetAll = () => {
    removeAllPlayers();
    removeAllUsedPrompts();
    setCurrentRoundPlayerIds(new Set());
    setCurrentRoundPrompt(null);
    setFlyingScores([]);
  };

  return (
    <>
      <div className="header">
        <div className="current-round-players" onClick={choosePrompt}>
          {formatCurrentRoundPlayerNames(
            getCurrentRoundPlayerNames(currentRoundPlayerIds, players)
          )}
        </div>
      </div>
      {currentRoundPrompt && (
        <div className="main">
          <div className="prompt-container">
            <div className="prompt">{currentRoundPrompt.text}</div>
          </div>
          <SortableJudgeScores
            onScore={(score, sourceRect) => finalizeRound(score, sourceRect)}
          />
        </div>
      )}
      <div className="footer">
        <div className="button-container buttons-left">
          <button className="button" onClick={() => resetAll()}>
            ×
          </button>
        </div>
        <div className="player-score-carousel">
          {players.map((player) => (
            <PlayerScoreContainer
              key={player.id}
              player={player}
              renamePlayer={(name) => renamePlayer(player.id, name)}
              removePlayer={() => removePlayer(player.id)}
            />
          ))}
        </div>
        <div className="button-container buttons-right">
          <button
            className="button create-round"
            onClick={() => createRoundOf(3)}
          >
            3
          </button>
          <button
            className="button create-round"
            onClick={() => createRoundOf(2)}
          >
            2
          </button>
          <button
            className="button create-round"
            onClick={() => createRoundOf(1)}
          >
            1
          </button>
          <button className="button" onClick={() => addPlayer()}>
            +
          </button>
        </div>
      </div>
      {flyingScores.map((flyingScore) => (
        <div
          key={flyingScore.id}
          className="flying-score"
          style={
            {
              "--start-x": `${flyingScore.startX}px`,
              "--start-y": `${flyingScore.startY}px`,
              "--end-x": `${flyingScore.endX}px`,
              "--end-y": `${flyingScore.endY}px`,
            } as React.CSSProperties
          }
        >
          {flyingScore.score}
        </div>
      ))}
    </>
  );
}

export default App;
