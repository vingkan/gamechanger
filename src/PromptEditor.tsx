import { useState } from "react";
import {
  type Prompt,
  getPromptsFromLocalStorage,
  savePromptsToLocalStorage,
  incrementNextPromptId,
  resetPromptsToDefaults,
} from "./prompts";

type EditablePrompt = Prompt & {
  tempId: string; // For React keys during editing
};

export function PromptEditor({
  onClose,
  onReset,
}: {
  onClose: () => void;
  onReset: () => void;
}) {
  const [prompts, setPrompts] = useState<EditablePrompt[]>(() => {
    return getPromptsFromLocalStorage().map((p) => ({
      ...p,
      tempId: p.id,
    }));
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handlePromptChange = (tempId: string, newText: string) => {
    setPrompts((prev) =>
      prev.map((p) => (p.tempId === tempId ? { ...p, text: newText } : p))
    );
  };

  const handlePlayersChange = (tempId: string, newPlayers: number) => {
    setPrompts((prev) =>
      prev.map((p) =>
        p.tempId === tempId ? { ...p, playersNeeded: newPlayers } : p
      )
    );
  };

  const handleDelete = (tempId: string) => {
    setPrompts((prev) => prev.filter((p) => p.tempId !== tempId));
  };

  const handleAddNew = () => {
    const newId = incrementNextPromptId();
    setPrompts((prev) => [
      ...prev,
      {
        id: `custom-${newId}`,
        text: "",
        playersNeeded: 1,
        tempId: `temp-${Date.now()}`,
      },
    ]);
  };

  const handleSave = () => {
    // Filter out empty prompts
    const validPrompts = prompts
      .filter((p) => p.text.trim().length > 0)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ tempId, ...prompt }) => prompt);
    savePromptsToLocalStorage(validPrompts);
    onClose();
  };

  const handleResetConfirm = () => {
    resetPromptsToDefaults();
    onReset();
    setShowResetConfirm(false);
    onClose();
  };

  return (
    <div className="prompt-editor-overlay">
      <div className="prompt-editor-container">
        <div className="prompt-editor-header">
          <h1>Edit Prompts</h1>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="prompt-editor-table-container">
          <table className="prompt-editor-table">
            <thead>
              <tr>
                <th>Prompt</th>
                <th>Players</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {prompts.map((prompt) => (
                <tr key={prompt.tempId}>
                  <td>
                    <input
                      type="text"
                      value={prompt.text}
                      onChange={(e) =>
                        handlePromptChange(prompt.tempId, e.target.value)
                      }
                      placeholder="Enter prompt text..."
                    />
                  </td>
                  <td>
                    <select
                      value={prompt.playersNeeded}
                      onChange={(e) =>
                        handlePlayersChange(
                          prompt.tempId,
                          parseInt(e.target.value, 10)
                        )
                      }
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(prompt.tempId)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="prompt-editor-footer">
          <div className="footer-left">
            <button className="add-button" onClick={handleAddNew}>
              + Add New Prompt
            </button>
          </div>
          <div className="footer-right">
            <button
              className="reset-button"
              onClick={() => setShowResetConfirm(true)}
            >
              Reset to Defaults
            </button>
            <button className="save-button" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>

        {showResetConfirm && (
          <div className="confirm-overlay">
            <div className="confirm-dialog">
              <h2>Reset to Defaults?</h2>
              <p>
                This will reset all prompts to their original values AND reset
                all game state (players, scores, used prompts). This action
                cannot be undone.
              </p>
              <div className="confirm-buttons">
                <button
                  className="cancel-button"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </button>
                <button className="confirm-button" onClick={handleResetConfirm}>
                  Reset Everything
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
