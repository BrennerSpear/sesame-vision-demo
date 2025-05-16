import { PROMPTS } from "../config/prompts";

interface CameraControlsProps {
  quality: number;
  setQuality: (quality: number) => void;
  isActive: boolean;
  setIsActive: (isActive: boolean) => void;
  model: "13b" | "7b" | "deepseek" | "deepseek2";
  setModel: (model: "13b" | "7b" | "deepseek" | "deepseek2") => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
}

export const CameraControls = ({
  quality,
  setQuality,
  isActive,
  setIsActive,
  model,
  setModel,
  prompt,
  setPrompt,
}: CameraControlsProps) => {
  return (
    <div className="space-y-2 rounded-lg bg-gray-100 p-2">
      <div>
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className={`w-full rounded-md px-3 py-1.5 text-sm ${
            isActive
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          {isActive ? "Stop Camera" : "Start Camera"}
        </button>
      </div>

      <div>
        <div className="flex justify-between">
          <label htmlFor="quality-slider" className="block font-medium text-xs">
            Quality: {Math.round(quality * 100)}%
          </label>
          <span className="text-gray-500 text-xs">
            {quality < 0.5 ? "Low" : quality < 0.8 ? "Medium" : "High"}
          </span>
        </div>
        <input
          id="quality-slider"
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={quality}
          onChange={(e) => setQuality(Number(e.target.value))}
          className="h-4 w-full"
        />
      </div>

      <div>
        <div className="flex justify-between">
          <span className="block font-medium text-xs">Model</span>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setModel("13b")}
            className={`rounded px-2 py-1 text-xs ${
              model === "13b"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            LLaVA-13B
          </button>
          <button
            type="button"
            onClick={() => setModel("7b")}
            className={`rounded px-2 py-1 text-xs ${
              model === "7b"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            LLaVA-7B
          </button>
          <button
            type="button"
            onClick={() => setModel("deepseek")}
            className={`rounded px-2 py-1 text-xs ${
              model === "deepseek"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            DeepSeek-7B
          </button>
          <button
            type="button"
            onClick={() => setModel("deepseek2")}
            className={`rounded px-2 py-1 text-xs ${
              model === "deepseek2"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            DeepSeek-VL2
          </button>
        </div>
      </div>

      <div>
        <div className="flex justify-between">
          <span className="block font-medium text-xs">Prompt</span>
        </div>
        <div className="mt-1">
          <select
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
          >
            {Object.entries(PROMPTS).map(([key, value]) => (
              <option key={key} value={value}>
                {key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <div className="mt-2 h-40 overflow-y-auto whitespace-pre-wrap rounded border border-gray-200 p-2 text-gray-500 text-xs">
            {prompt}
          </div>
        </div>
      </div>
    </div>
  );
};
