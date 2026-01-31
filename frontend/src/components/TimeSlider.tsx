import { useCallback, useEffect, useRef, useState } from "react";
import { Text, Spacing } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { useTimeSliderStore } from "../stores/useTimeSliderStore";

const TOTAL_STEPS = 24;
const THUMB_SIZE = 24;
const THUMB_RADIUS = THUMB_SIZE / 2;
const TRACK_HEIGHT = 4;
const LABEL_MIN_GAP_PX = 8;

function toTrackPos(percent: number) {
  return `calc(${THUMB_RADIUS}px + (100% - ${THUMB_SIZE}px) * ${percent / 100})`;
}

function formatHour(hour: number) {
  return `${hour}:00`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

type ThumbType = "start" | "end";

export default function TimeSlider() {
  const {
    startHour: start,
    endHour: end,
    setStartHour: setStart,
    setEndHour: setEnd,
  } = useTimeSliderStore();
  const trackRef = useRef<HTMLDivElement>(null);

  const getStepFromX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const usable = rect.width - THUMB_SIZE;
    const ratio = (clientX - rect.left - THUMB_RADIUS) / usable;
    return Math.round(clamp(ratio, 0, 1) * TOTAL_STEPS);
  }, []);
  const draggingRef = useRef<ThumbType | undefined>(undefined);

  const handleMove = useCallback(
    (clientX: number) => {
      const type = draggingRef.current;
      if (!type) return;
      const step = getStepFromX(clientX);

      if (type === "start") {
        setStart(clamp(step, 0, end - 1));
      } else {
        setEnd(clamp(step, start + 1, TOTAL_STEPS));
      }
    },
    [getStepFromX, start, end, setStart, setEnd],
  );

  const handlePointerDown = useCallback(
    (type: ThumbType) => (e: React.PointerEvent) => {
      e.preventDefault();
      draggingRef.current = type;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      handleMove(e.clientX);
    },
    [handleMove],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = undefined;
  }, []);

  const [trackWidth, setTrackWidth] = useState(0);
  const startLabelRef = useRef<HTMLDivElement>(null);
  const endLabelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setTrackWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const startPercent = (start / TOTAL_STEPS) * 100;
  const endPercent = (end / TOTAL_STEPS) * 100;

  // 픽셀 기반 라벨 위치 계산 (toTrackPos의 픽셀 버전)
  const usable = trackWidth - THUMB_SIZE;
  const startCenterPx = THUMB_RADIUS + usable * (startPercent / 100);
  const endCenterPx = THUMB_RADIUS + usable * (endPercent / 100);

  const startLabelW = startLabelRef.current?.offsetWidth ?? 0;
  const endLabelW = endLabelRef.current?.offsetWidth ?? 0;
  const halfStart = startLabelW / 2;
  const halfEnd = endLabelW / 2;
  const minDist = halfStart + halfEnd + LABEL_MIN_GAP_PX;

  let adjStart = startCenterPx;
  let adjEnd = endCenterPx;

  if (adjEnd - adjStart < minDist) {
    const mid = clamp(
      (startCenterPx + endCenterPx) / 2,
      halfStart + minDist / 2,
      trackWidth - halfEnd - minDist / 2,
    );
    adjStart = mid - minDist / 2;
    adjEnd = mid + minDist / 2;
  }

  // 벽 clamp
  adjStart = clamp(adjStart, halfStart, trackWidth - halfStart);
  adjEnd = clamp(adjEnd, halfEnd, trackWidth - halfEnd);

  return (
    <>
      <div className="flex justify-between px-5">
        <Text color={adaptive.grey600} typography="t7" fontWeight="medium">
          {`시작시간`}
        </Text>
        <Text color={adaptive.grey600} typography="t7" fontWeight="medium">
          {`종료시간`}
        </Text>
      </div>
      <Spacing size={20} />

      {/* Slider */}
      <div
        className="overflow-visible px-5"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Track (thumbs are positioned relative to this) */}
        <div
          ref={trackRef}
          className="relative w-full overflow-visible rounded-full"
          style={{
            height: TRACK_HEIGHT,
          }}
        >
          {/* Inactive track */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: adaptive.grey200 }}
          />
          {/* Active range */}
          <div
            className="absolute top-0 h-full rounded-full"
            style={{
              left: toTrackPos(startPercent),
              right: `calc(100% - ${toTrackPos(endPercent)})`,
              backgroundColor: adaptive.blue500,
            }}
          />

          {/* Start thumb */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              width: 44,
              height: 44,
              top: "50%",
              left: toTrackPos(startPercent),
              transform: "translate(-50%, -50%)",
              touchAction: "none",
            }}
            onPointerDown={handlePointerDown("start")}
          >
            <div
              className="rounded-full shadow-lg"
              style={{
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                backgroundColor: "white",
                outline: `2px solid ${adaptive.greyOpacity100}`,
              }}
            />
          </div>

          {/* End thumb */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              width: 44,
              height: 44,
              top: "50%",
              left: toTrackPos(endPercent),
              transform: "translate(-50%, -50%)",
              touchAction: "none",
            }}
            onPointerDown={handlePointerDown("end")}
          >
            <div
              className="rounded-full shadow-lg"
              style={{
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                backgroundColor: "white",
                outline: `2px solid ${adaptive.greyOpacity100}`,
              }}
            />
          </div>
        </div>

        {/* Labels */}
        <div className="relative" style={{ height: 24, marginTop: 16 }}>
          <div
            ref={startLabelRef}
            className="absolute whitespace-nowrap"
            style={{
              left: adjStart,
              transform: "translateX(-50%)",
            }}
          >
            <Text color={adaptive.grey600} typography="t7" fontWeight="medium">
              {formatHour(start)}
            </Text>
          </div>

          <div
            ref={endLabelRef}
            className="absolute whitespace-nowrap"
            style={{
              right: trackWidth - adjEnd,
              transform: "translateX(50%)",
            }}
          >
            <Text color={adaptive.grey600} typography="t7" fontWeight="medium">
              {formatHour(end)}
            </Text>
          </div>
        </div>
      </div>
    </>
  );
}
