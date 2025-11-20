import { useState, useRef } from "react";

export function SortableJudgeScores({
  onScore,
}: {
  onScore: (score: number, sourceRect: DOMRect) => void;
}) {
  const [judgeScores, setJudgeScores] = useState<number[]>([0]);
  const [medianIndex, setMedianIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [transforms, setTransforms] = useState<{ [key: number]: number }>({});
  const [isEditing, setIsEditing] = useState(false);
  const scoresContainerRef = useRef<HTMLDivElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);

  const handleScoresEdit = (text: string) => {
    // Parse space-separated numbers
    const numbers = text
      .split(/\s+/)
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

    if (numbers.length > 0) {
      setJudgeScores(numbers);
      setMedianIndex(null); // Reset median when scores change
    }
    setIsEditing(false);
  };

  const handleScoresClick = () => {
    if (!isAnimating && !isEditing) {
      setIsEditing(true);
      // Focus the editable div after it renders
      setTimeout(() => {
        if (editableRef.current) {
          editableRef.current.focus();
          // Select all text
          const range = document.createRange();
          range.selectNodeContents(editableRef.current);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 0);
    }
  };

  const sortScoresWithAnimation = () => {
    if (isAnimating || judgeScores.length === 0 || !scoresContainerRef.current)
      return;

    const container = scoresContainerRef.current;
    const scoreElements = Array.from(
      container.querySelectorAll(".judge-score")
    ) as HTMLElement[];

    if (scoreElements.length === 0) return;

    setIsAnimating(true);

    // Get initial positions
    const initialPositions = scoreElements.map((el) => ({
      left: el.offsetLeft,
      width: el.offsetWidth,
    }));

    // Create sorted array with original indices
    const indexed = judgeScores.map((score, idx) => ({
      score,
      originalIdx: idx,
    }));
    const sorted = [...indexed].sort((a, b) => a.score - b.score);

    // Calculate median index (middle-low for even counts)
    const medianIdx = Math.floor((sorted.length - 1) / 2);

    // Calculate where each element needs to move
    const newTransforms: { [key: number]: number } = {};
    sorted.forEach((item, newIdx) => {
      const oldIdx = item.originalIdx;
      const oldPos = initialPositions[oldIdx];
      const newPos = initialPositions[newIdx];
      if (oldPos && newPos) {
        newTransforms[oldIdx] = newPos.left - oldPos.left;
      }
    });

    // Apply transforms for animation
    setTransforms(newTransforms);

    // Wait for animation to complete, then update state
    setTimeout(() => {
      setTransforms({});
      setJudgeScores(sorted.map((item) => item.score));
      setMedianIndex(medianIdx);
      setIsAnimating(false);
    }, 600); // Match CSS transition duration
  };

  const handleFinalizeScore = () => {
    if (medianIndex === null || !scoresContainerRef.current) return;

    const medianScore = judgeScores[medianIndex];

    // Get the median score element's position
    const medianElement =
      scoresContainerRef.current.querySelector(`.judge-score.median`);

    if (medianElement) {
      const rect = medianElement.getBoundingClientRect();
      onScore(medianScore, rect);
      setJudgeScores([0]);
      setMedianIndex(null);
    }
  };

  return (
    <div className="judge-container">
      {isEditing ? (
        <div
          ref={editableRef}
          className="judge-scores"
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onBlur={(e) => {
            const text = e.target.innerText;
            handleScoresEdit(text);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        >
          {judgeScores.join(" ")}
        </div>
      ) : (
        <div
          ref={scoresContainerRef}
          className="judge-scores"
          onClick={handleScoresClick}
        >
          {judgeScores.map((score, idx) => (
            <span
              key={`${score}-${idx}`}
              className={`judge-score ${medianIndex === idx ? "median" : ""} ${
                isAnimating ? "animating" : ""
              }`}
              data-original-index={idx}
              style={{
                transform:
                  transforms[idx] !== undefined
                    ? `translateX(${transforms[idx]}px)`
                    : undefined,
              }}
            >
              {score}
            </span>
          ))}
        </div>
      )}
      <button
        className="button sort-button"
        onClick={sortScoresWithAnimation}
        disabled={isAnimating}
      >
        ⇄
      </button>
      <button
        className="button finalize-button"
        onClick={handleFinalizeScore}
        disabled={medianIndex === null}
      >
        ✓
      </button>
    </div>
  );
}
