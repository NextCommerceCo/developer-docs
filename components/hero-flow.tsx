/**
 * Hero flow diagram: left nodes → center logo → right nodes
 * with colored curved connector lines and animated flowing dots.
 */

const LEFT_NODES = [
  { label: 'Campaigns', color: '#f97316' },
  { label: 'Storefront', color: '#22c55e' },
  { label: 'Admin API', color: '#3b82f6' },
];

const RIGHT_NODES = [
  { label: 'Fulfillment', color: '#22c55e' },
  { label: 'Payments', color: '#3b82f6' },
  { label: 'Attribution', color: '#a855f7' },
];

// Layout constants
const W = 520;
const H = 220;
const CX = W / 2;
const CY = H / 2;
const NODE_W = 110;
const NODE_H = 34;
const LOGO_R = 28;
const LEFT_X = 10;
const RIGHT_X = W - NODE_W - 10;
const SPACING = 70;

function nodeY(index: number): number {
  return CY + (index - 1) * SPACING;
}

function leftPath(i: number): string {
  const sy = nodeY(i);
  const ex = CX - LOGO_R - 2;
  return `M ${LEFT_X + NODE_W} ${sy} C ${LEFT_X + NODE_W + 60} ${sy}, ${ex - 60} ${CY}, ${ex} ${CY}`;
}

function rightPath(i: number): string {
  const sy = nodeY(i);
  const sx = CX + LOGO_R + 2;
  return `M ${sx} ${CY} C ${sx + 60} ${CY}, ${RIGHT_X - 60} ${sy}, ${RIGHT_X} ${sy}`;
}

export function HeroFlow() {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full max-w-130 h-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Connector lines — left to center */}
      {LEFT_NODES.map((node, i) => (
        <g key={`l-${i}`}>
          <path
            id={`lp-${i}`}
            d={leftPath(i)}
            stroke={node.color}
            strokeWidth={1.5}
            strokeOpacity={0.5}
          />
          {/* Animated dot 1 */}
          <circle r={2.5} fill={node.color} fillOpacity={0.9}>
            <animateMotion dur={`${2.5 + i * 0.4}s`} repeatCount="indefinite">
              <mpath href={`#lp-${i}`} />
            </animateMotion>
          </circle>
          {/* Animated dot 2 (staggered) */}
          <circle r={2} fill={node.color} fillOpacity={0.5}>
            <animateMotion dur={`${2.5 + i * 0.4}s`} begin={`${1.2 + i * 0.2}s`} repeatCount="indefinite">
              <mpath href={`#lp-${i}`} />
            </animateMotion>
          </circle>
        </g>
      ))}

      {/* Connector lines — center to right */}
      {RIGHT_NODES.map((node, i) => (
        <g key={`r-${i}`}>
          <path
            id={`rp-${i}`}
            d={rightPath(i)}
            stroke={node.color}
            strokeWidth={1.5}
            strokeOpacity={0.5}
          />
          {/* Animated dot 1 */}
          <circle r={2.5} fill={node.color} fillOpacity={0.9}>
            <animateMotion dur={`${2.5 + i * 0.4}s`} repeatCount="indefinite">
              <mpath href={`#rp-${i}`} />
            </animateMotion>
          </circle>
          {/* Animated dot 2 (staggered) */}
          <circle r={2} fill={node.color} fillOpacity={0.5}>
            <animateMotion dur={`${2.5 + i * 0.4}s`} begin={`${1.2 + i * 0.2}s`} repeatCount="indefinite">
              <mpath href={`#rp-${i}`} />
            </animateMotion>
          </circle>
        </g>
      ))}

      {/* Center logo */}
      <circle cx={CX} cy={CY} r={LOGO_R} fill="#3C7DFF" />
      <image
        href="/next-icon-white.svg"
        x={CX - 20}
        y={CY - 20}
        width={40}
        height={40}
      />

      {/* Left node pills */}
      {LEFT_NODES.map((node, i) => {
        const y = nodeY(i);
        return (
          <g key={`ln-${i}`}>
            <rect
              x={LEFT_X}
              y={y - NODE_H / 2}
              width={NODE_W}
              height={NODE_H}
              rx={8}
              className="fill-fd-card stroke-fd-border"
              strokeWidth={1}
            />
            <text
              x={LEFT_X + NODE_W / 2}
              y={y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-fd-foreground"
              fontSize={12}
              fontWeight={500}
              fontFamily="var(--font-sans, system-ui)"
            >
              {node.label}
            </text>
            <circle cx={LEFT_X + 14} cy={y} r={3.5} fill={node.color} fillOpacity={0.7} />
          </g>
        );
      })}

      {/* Right node pills */}
      {RIGHT_NODES.map((node, i) => {
        const y = nodeY(i);
        return (
          <g key={`rn-${i}`}>
            <rect
              x={RIGHT_X}
              y={y - NODE_H / 2}
              width={NODE_W}
              height={NODE_H}
              rx={8}
              className="fill-fd-card stroke-fd-border"
              strokeWidth={1}
            />
            <text
              x={RIGHT_X + NODE_W / 2}
              y={y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-fd-foreground"
              fontSize={12}
              fontWeight={500}
              fontFamily="var(--font-sans, system-ui)"
            >
              {node.label}
            </text>
            <circle cx={RIGHT_X + NODE_W - 14} cy={y} r={3.5} fill={node.color} fillOpacity={0.7} />
          </g>
        );
      })}
    </svg>
  );
}
