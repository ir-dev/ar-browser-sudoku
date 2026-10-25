import React, { useRef, useState, useEffect } from "react";
import "./App.css";
import Processor, { VideoReadyPayload } from "./augmentedReality/Processor";
import StatsPanel from "./components/StatsPanel";
import CaptureButton from "./components/CaptureButton";
import CaptureGallery from "./components/CaptureGallery";
import StatusBadge, { ProcessingStatus } from "./components/StatusBadge";
import { useCaptures } from "./hooks/useCaptures";

// start processing video
const processor = new Processor();

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [videoWidth, setVideoWidth] = useState(100);
  const [videoHeight, setVideoHeight] = useState(100);

  const [imageCaptureTime, setImageCaptureTime] = useState(0);
  const [thresholdTime, setThresholdTime] = useState(0);
  const [connectedComponentTime, setConnectedComponentTime] = useState(0);
  const [getCornerPointsTime, setGetCornerPOintsTime] = useState(0);
  const [extractImageTime, setExtractImageTime] = useState(0);
  const [extractBoxesTime, setExtractBoxesTime] = useState(0);
  const [ocrTime, setOcrTime] = useState(0);
  const [solveTime, setSolveTime] = useState(0);

  const [status, setStatus] = useState<ProcessingStatus>("scanning");
  const [statsOpen, setStatsOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const { captures, addCapture, removeCapture, clearAll } = useCaptures();

  // Gate for the one-time auto-capture on the first solve of the session.
  // Deliberately the ONLY thing that decides whether auto-capture fires -
  // it never resets and never consults `mashed` below, so a later or
  // different puzzle solving does not re-trigger it.
  const hasAutoCapturedRef = useRef(false);
  // Tracks whether the solved digits changed since the last tick - kept as
  // a reusable "new solve" detector (e.g. for future status re-animation),
  // but intentionally decoupled from the auto-capture gate above.
  const lastMashedRef = useRef("");

  // start the video playing
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      processor.startVideo(video).then(
        () => console.log("Video started"),
        (error) => alert(error.message)
      );
    }
  }, [videoRef]);

  // render the overlay
  useEffect(() => {
    const interval = window.setInterval(() => {
      const canvas = previewCanvasRef.current;
      if (canvas && processor.isVideoRunning) {
        // update the peformance stats
        setImageCaptureTime(processor.captureTime);
        setThresholdTime(processor.thresholdTime);
        setConnectedComponentTime(processor.connectedComponentTime);
        setGetCornerPOintsTime(processor.cornerPointTime);
        setExtractImageTime(processor.extractPuzzleTime);
        setExtractBoxesTime(processor.extractBoxesTime);
        setOcrTime(processor.neuralNetTime);
        setSolveTime(processor.solveTime);

        // derive the current scanning/detected/solved status
        setStatus(
          processor.solvedPuzzle
            ? "solved"
            : processor.corners
            ? "detected"
            : "scanning"
        );

        // display the output from the processor
        const context = canvas.getContext("2d");
        if (context) {
          context.drawImage(processor.video, 0, 0);
          if (processor.corners) {
            const {
              topLeft,
              topRight,
              bottomLeft,
              bottomRight,
            } = processor.corners;
            context.strokeStyle = "rgba(0,200,0,0.5)";
            context.fillStyle = "rgba(0,0,0,0.3)";
            context.lineWidth = 3;
            context.beginPath();
            context.moveTo(topLeft.x, topLeft.y);
            context.lineTo(topRight.x, topRight.y);
            context.lineTo(bottomRight.x, bottomRight.y);
            context.lineTo(bottomLeft.x, bottomLeft.y);
            context.closePath();
            context.stroke();
            context.fill();
          }
          if (processor.gridLines) {
            context.strokeStyle = "rgba(0,200,0,0.5)";
            context.lineWidth = 2;
            processor.gridLines.forEach((line) => {
              context.moveTo(line.p1.x, line.p1.y);
              context.lineTo(line.p2.x, line.p2.y);
            });
            context.stroke();
          }
          if (processor.solvedPuzzle) {
            context.fillStyle = "rgba(0,200,0,1)";
            for (let y = 0; y < 9; y++) {
              for (let x = 0; x < 9; x++) {
                if (processor.solvedPuzzle[y][x]) {
                  const {
                    digit,
                    digitHeight,
                    digitRotation,
                    position,
                    isKnown,
                  } = processor.solvedPuzzle[y][x];
                  if (!isKnown) {
                    context.font = `bold ${digitHeight}px sans-serif`;
                    context.translate(position.x, position.y);
                    context.rotate(Math.PI - digitRotation);
                    context.fillText(
                      digit.toString(),
                      -digitHeight / 4,
                      digitHeight / 3
                    );
                    context.setTransform();
                  }
                }
              }
            }

            // unique key for the current solution, to detect a new/changed solve
            const mashed = Object.keys(processor.solvedPuzzle).reduce(function (
              acc,
              key
            ) {
              return `${acc}_${processor.solvedPuzzle[key]
                .map((t) => t.digit)
                .join()}`;
            }, "");
            lastMashedRef.current = mashed;

            // auto-capture exactly once per session, on the first solve
            if (!hasAutoCapturedRef.current) {
              hasAutoCapturedRef.current = true;
              addCapture(canvas.toDataURL());
              setGalleryOpen(true);
            }
          }
        }
      }
    }, 100);
    return () => {
      window.clearInterval(interval);
    };
  }, [previewCanvasRef, addCapture]);

  // update the video scale as needed
  useEffect(() => {
    function videoReadyListener({ width, height }: VideoReadyPayload) {
      setVideoWidth(width);
      setVideoHeight(height);
    }
    processor.on("videoReady", videoReadyListener);
    return () => {
      processor.off("videoReady", videoReadyListener);
    };
  });

  function handleManualCapture() {
    const canvas = previewCanvasRef.current;
    if (canvas) {
      addCapture(canvas.toDataURL());
      setGalleryOpen(true);
    }
  }

  return (
    <div className="App">
      {/* need to have a visible video for mobile safari to work */}
      <video
        ref={videoRef}
        className="video-preview"
        width={10}
        height={10}
        playsInline
        muted
      />
      <canvas
        ref={previewCanvasRef}
        className="preview-canvas"
        width={videoWidth}
        height={videoHeight}
      />

      <div className="app-header">
        <StatusBadge status={status} />
      </div>

      <CaptureButton
        visible={!!processor.solvedPuzzle}
        onCapture={handleManualCapture}
      />

      <CaptureGallery
        captures={captures}
        isOpen={galleryOpen}
        onToggle={() => setGalleryOpen((o) => !o)}
        onDelete={removeCapture}
        onClearAll={clearAll}
      />

      <StatsPanel
        imageCaptureTime={imageCaptureTime}
        thresholdTime={thresholdTime}
        connectedComponentTime={connectedComponentTime}
        getCornerPointsTime={getCornerPointsTime}
        extractImageTime={extractImageTime}
        extractBoxesTime={extractBoxesTime}
        ocrTime={ocrTime}
        solveTime={solveTime}
        isOpen={statsOpen}
        onToggle={() => setStatsOpen((o) => !o)}
      />
    </div>
  );
}

export default App;
