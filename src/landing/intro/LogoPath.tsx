import type { CSSProperties } from "react";
import { MARK, SHIELD } from "../../components/Logo";

/* The logo assembled from simple shapes, on the real logo's coordinates (viewBox of Logo.tsx).
   step 0 talent: a large cream sphere in the middle
   step 1 learn:  the sphere takes its place in the logo, the book opens under it
   step 2 idea:   the top ray grows, a gold dot at its end
   step 3 build:  the left ray
   step 4 demo:   the right ray
   step 5 defend: the shield is drawn around everything
   step 6 final:  the traced logo replaces the shapes (cream shield, blue mark)
   Pure SVG and CSS transitions, so it is light enough for phones. */

const CREAM = "#FBF8F1";
const SPARK = "#FFC83D";
const BLUE = "#0A3D91";

// sub-paths of the traced mark: [head, left page, right page, right page hole, left page hole]
const SUB = MARK.slice(SHIELD.length)
  .split(" M ")
  .filter((p) => p.trim())
  .map((p) => `M ${p.trim()}`);
const BOOK_LEFT = `${SUB[1]} ${SUB[4]}`;
const BOOK_RIGHT = `${SUB[2]} ${SUB[3]}`;

const SPHERE = { x: 315.5, y: 300, r: 43.5 };
const MIDDLE_Y = 341; // vertical centre of the viewBox
const DOT_R = 19.5;
const RAYS = [
  { key: "top", from: [315.5, 256.5], to: [315.5, 230.5], dot: [315.5, 211], at: 2 },
  { key: "left", from: [280.4, 274.4], to: [253.8, 255], dot: [238, 243.5], at: 3 },
  { key: "right", from: [350.6, 274.2], to: [377.3, 254.6], dot: [393, 243], at: 4 },
] as const;

const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

export function LogoPath({ step, faded = false }: { step: number; faded?: boolean }) {
  const final = step >= 6;
  const t = (props: string, ms = 700, delay = 0) => props.split(",").map((p) => `${p.trim()} ${ms}ms ${ease} ${delay}ms`).join(", ");
  const parts: CSSProperties = { opacity: final ? 0 : 1, transition: t("opacity", 500, final ? 450 : 0) };

  return (
    <svg viewBox="154 145 322 392" className="h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <radialGradient id="intro-sphere" cx="0.4" cy="0.36" r="0.7">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor={CREAM} />
          <stop offset="1" stopColor="#E6DCC6" />
        </radialGradient>
        <radialGradient id="intro-halo">
          <stop offset="0.45" stopColor={CREAM} stopOpacity="0.32" />
          <stop offset="1" stopColor={CREAM} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* shield outline, drawn at step 5 */}
      <path
        d={SHIELD}
        fill="none"
        stroke={CREAM}
        strokeWidth={5}
        pathLength={1}
        strokeDasharray="1 1"
        style={{ strokeDashoffset: step >= 5 ? 0 : 1, opacity: step >= 5 && !final ? 1 : 0, transition: t("stroke-dashoffset, opacity", 900) }}
      />

      <g style={parts}>
        {/* book: each page opens from the spine */}
        {[BOOK_LEFT, BOOK_RIGHT].map((d, i) => (
          <path
            key={i}
            d={d}
            fill={CREAM}
            fillRule="evenodd"
            style={{
              transformBox: "fill-box",
              transformOrigin: i === 0 ? "100% 50%" : "0% 50%",
              transform: step >= 1 ? "scaleX(1)" : "scaleX(0)",
              opacity: step >= 1 ? 1 : 0,
              transition: t("transform, opacity", 800, 200),
            }}
          />
        ))}

        {/* rays and their dots */}
        {RAYS.map((r) => {
          const on = step >= r.at;
          return (
            <g key={r.key}>
              <line
                x1={r.from[0]}
                y1={r.from[1]}
                x2={r.to[0]}
                y2={r.to[1]}
                stroke={CREAM}
                strokeWidth={15}
                pathLength={1}
                strokeDasharray="1 1"
                style={{ strokeDashoffset: on ? 0 : 1, transition: t("stroke-dashoffset", 450) }}
              />
              <circle
                cx={r.dot[0]}
                cy={r.dot[1]}
                r={DOT_R}
                fill={SPARK}
                style={{ transformBox: "fill-box", transformOrigin: "center", transform: on ? "scale(1)" : "scale(0)", transition: t("transform", 500, on ? 380 : 0) }}
              />
            </g>
          );
        })}

        {/* the sphere: large in the middle at step 0, then in its place */}
        <g
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
            transform: step === 0 ? `translate(0px, ${MIDDLE_Y - SPHERE.y}px) scale(2.3)` : "translate(0px, 0px) scale(1)",
            transition: t("transform", 900),
          }}
        >
          <circle cx={SPHERE.x} cy={SPHERE.y} r={SPHERE.r * 2} fill="url(#intro-halo)" style={{ opacity: step >= 5 ? 0 : 1, transition: t("opacity", 600) }} />
          <circle cx={SPHERE.x} cy={SPHERE.y} r={SPHERE.r} fill="url(#intro-sphere)" />
        </g>
      </g>

      {/* the traced logo, exactly as in Logo.jpg: blue silhouette under the cream shield with the mark cut out */}
      <g style={{ opacity: final && !faded ? 1 : 0, transition: t("opacity", faded ? 1200 : 600) }}>
        <path d={SHIELD} fill={BLUE} />
        <path d={MARK} fill={CREAM} fillRule="evenodd" />
      </g>
    </svg>
  );
}

/** step keys in order, for the captions */
export const STEPS = ["talent", "learn", "idea", "build", "demo", "defend"] as const;
