interface CameraControlsProps {
  fps: number;
  setFps: (fps: number) => void;
  quality: number;
  setQuality: (quality: number) => void;
  isActive: boolean;
  setIsActive: (isActive: boolean) => void;
}

export const CameraControls = ({
  fps,
  setFps,
  quality,
  setQuality,
  isActive,
  setIsActive,
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
          <label htmlFor="fps-slider" className="block font-medium text-xs">
            FPS: {fps}
          </label>
          <span className="text-gray-500 text-xs">
            {fps < 3 ? "Low" : fps < 8 ? "Medium" : "High"}
          </span>
        </div>
        <input
          id="fps-slider"
          type="range"
          min="1"
          max="15"
          step="1"
          value={fps}
          onChange={(e) => setFps(Number(e.target.value))}
          className="h-4 w-full"
        />
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
    </div>
  );
};
