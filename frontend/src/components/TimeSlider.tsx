import { useCallback, useRef } from "react";
import { Text, Spacing } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { useTimeSliderStore } from "../stores/useTimeSliderStore";

const TOTAL_STEPS = 24;
const THUMB_SIZE = 24;
const TRACK_HEIGHT = 4;

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
    const ratio = (clientX - rect.left) / rect.width;
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

  const startPercent = (start / TOTAL_STEPS) * 100;
  const endPercent = (end / TOTAL_STEPS) * 100;

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
        className="px-5"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Track (thumbs are positioned relative to this) */}
        <div
          ref={trackRef}
          className="relative w-full rounded-full"
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
              left: `${startPercent}%`,
              right: `${100 - endPercent}%`,
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
              left: `${startPercent}%`,
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
              left: `${endPercent}%`,
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
      </div>

      {/* Labels */}
      <Spacing size={22} />
      <div className="flex justify-between px-5">
        <Text color={adaptive.grey600} typography="t7" fontWeight="medium">
          {`${formatHour(start)}`}
        </Text>
        <Text color={adaptive.grey600} typography="t7" fontWeight="medium">
          {`${formatHour(end)}`}
        </Text>
      </div>
    </>
  );
}
