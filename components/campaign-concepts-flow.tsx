/**
 * Campaign Core Concepts animated diagrams:
 *   CampaignFunnelFlow  — Presell → Landing → Checkout → Upsell → Receipt
 *   CampaignAnatomy     — Campaign hub → Packages, Offers, Shipping, Payments, Currency
 *
 * Pure SVG + <animateMotion>; no client-side JS required.
 */

// ── Funnel Flow ────────────────────────────────────────────────────────────────

const FUNNEL_PAGES = [
  { label: 'Presell', sublabel: 'Advertorial', color: '#ec4899' },
  { label: 'Landing', sublabel: 'Marketing', color: '#f97316' },
  { label: 'Checkout', sublabel: 'Order Form', color: '#3c7dff' },
  { label: 'Upsell', sublabel: 'Post-Purchase', color: '#a855f7' },
  { label: 'Receipt', sublabel: 'Confirmation', color: '#22c55e' },
];

const FW = 640;
const FH = 90;
const FNW = 100;
const FNH = 44;
const FCY = FH / 2;
const FPAD = 20;

function funnelNodeX(i: number): number {
  const spacing = (FW - FPAD * 2 - FNW * FUNNEL_PAGES.length) / (FUNNEL_PAGES.length - 1);
  return FPAD + i * (FNW + spacing);
}

export function CampaignFunnelFlow() {
  return (
    <svg
      viewBox={`0 0 ${FW} ${FH}`}
      className="w-full max-w-2xl h-auto my-4"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Connecting paths + animated dots */}
      {FUNNEL_PAGES.slice(0, -1).map((page, i) => {
        const x1 = funnelNodeX(i) + FNW;
        const x2 = funnelNodeX(i + 1);
        const d = `M ${x1} ${FCY} L ${x2} ${FCY}`;
        return (
          <g key={`fp-${i}`}>
            <path
              id={`fp-${i}`}
              d={d}
              stroke={page.color}
              strokeWidth={1.5}
              strokeOpacity={0.35}
            />
            <circle r={3.5} fill={page.color} fillOpacity={0.85}>
              <animateMotion dur={`${1.1 + i * 0.2}s`} repeatCount="indefinite">
                <mpath href={`#fp-${i}`} />
              </animateMotion>
            </circle>
            <circle r={2} fill={page.color} fillOpacity={0.45}>
              <animateMotion
                dur={`${1.1 + i * 0.2}s`}
                begin="0.55s"
                repeatCount="indefinite"
              >
                <mpath href={`#fp-${i}`} />
              </animateMotion>
            </circle>
          </g>
        );
      })}

      {/* Node pills */}
      {FUNNEL_PAGES.map((page, i) => {
        const x = funnelNodeX(i);
        return (
          <g key={`fn-${i}`}>
            <rect
              x={x}
              y={FCY - FNH / 2}
              width={FNW}
              height={FNH}
              rx={8}
              className="fill-fd-card stroke-fd-border"
              strokeWidth={1}
            />
            <text
              x={x + FNW / 2}
              y={FCY - 7}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-fd-foreground"
              fontSize={11}
              fontWeight={600}
              fontFamily="var(--font-sans, system-ui)"
            >
              {page.label}
            </text>
            <text
              x={x + FNW / 2}
              y={FCY + 8}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-fd-muted-foreground"
              fontSize={9}
              fontFamily="var(--font-sans, system-ui)"
            >
              {page.sublabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Campaign Anatomy ───────────────────────────────────────────────────────────
//
// Flow: [Config items] → Campaign → Next Commerce
//   Left  — campaign configuration inputs (Packages, Offers, Shipping, Payments, Currency)
//   Center — Campaign (API hub)
//   Right  — Next Commerce back-end (Products, Orders, Fulfillment)

const A_LEFT_NODES = [
  { label: 'Packages', sublabel: 'Products & pricing', color: '#3c7dff' },
  { label: 'Offers', sublabel: 'Discounts & codes', color: '#f97316' },
  { label: 'Shipping', sublabel: 'Delivery methods', color: '#22c55e' },
  { label: 'Payments', sublabel: 'Payment options', color: '#a855f7' },
  { label: 'Currency', sublabel: 'Localization', color: '#ec4899' },
];

const A_RIGHT_NODES = [
  { label: 'Products', sublabel: 'Catalog & inventory', color: '#22c55e' },
  { label: 'Orders', sublabel: 'Order management', color: '#3b82f6' },
  { label: 'Fulfillment', sublabel: 'Shipping & logistics', color: '#a855f7' },
];

const AW = 560;
const AH = 310;
const ACX = AW / 2;  // 280
const ACY = AH / 2;  // 155

// Left config nodes
const AL_X = 10;
const AL_W = 118;
const AL_H = 42;
const AL_SPACING = 56;

// Center Campaign node
const AC_W = 120;
const AC_H = 62;
const AC_X = ACX - AC_W / 2;    // 220 (left edge)
const AC_RIGHT = ACX + AC_W / 2; // 340 (right edge)

// Right Next nodes
const AR_X = 426;
const AR_W = 118;
const AR_H = 42;
const AR_SPACING = 62;

function aLeftY(i: number): number {
  const totalH = (A_LEFT_NODES.length - 1) * AL_SPACING;
  return ACY - totalH / 2 + i * AL_SPACING;
}

function aRightY(i: number): number {
  const totalH = (A_RIGHT_NODES.length - 1) * AR_SPACING;
  return ACY - totalH / 2 + i * AR_SPACING;
}

// Left node → Campaign center-left edge
function aLeftPath(i: number): string {
  const fromX = AL_X + AL_W;
  const fromY = aLeftY(i);
  const mx = (fromX + AC_X) / 2;
  return `M ${fromX} ${fromY} C ${mx} ${fromY}, ${mx} ${ACY}, ${AC_X} ${ACY}`;
}

// Campaign center-right edge → right node
function aRightPath(i: number): string {
  const toX = AR_X;
  const toY = aRightY(i);
  const mx = (AC_RIGHT + toX) / 2;
  return `M ${AC_RIGHT} ${ACY} C ${mx} ${ACY}, ${mx} ${toY}, ${toX} ${toY}`;
}

export function CampaignAnatomy() {
  return (
    <svg
      viewBox={`0 0 ${AW} ${AH}`}
      className="w-full max-w-2xl h-auto my-4"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left paths: config items → Campaign */}
      {A_LEFT_NODES.map((node, i) => (
        <g key={`alp-${i}`}>
          <path
            id={`alp-${i}`}
            d={aLeftPath(i)}
            stroke={node.color}
            strokeWidth={1.5}
            strokeOpacity={0.4}
          />
          <circle r={2.5} fill={node.color} fillOpacity={0.9}>
            <animateMotion dur={`${2 + i * 0.3}s`} repeatCount="indefinite">
              <mpath href={`#alp-${i}`} />
            </animateMotion>
          </circle>
          <circle r={1.5} fill={node.color} fillOpacity={0.5}>
            <animateMotion
              dur={`${2 + i * 0.3}s`}
              begin={`${1 + i * 0.15}s`}
              repeatCount="indefinite"
            >
              <mpath href={`#alp-${i}`} />
            </animateMotion>
          </circle>
        </g>
      ))}

      {/* Right paths: Campaign → Next nodes */}
      {A_RIGHT_NODES.map((node, i) => (
        <g key={`arp-${i}`}>
          <path
            id={`arp-${i}`}
            d={aRightPath(i)}
            stroke={node.color}
            strokeWidth={1.5}
            strokeOpacity={0.4}
          />
          <circle r={2.5} fill={node.color} fillOpacity={0.9}>
            <animateMotion dur={`${2 + i * 0.4}s`} repeatCount="indefinite">
              <mpath href={`#arp-${i}`} />
            </animateMotion>
          </circle>
          <circle r={1.5} fill={node.color} fillOpacity={0.5}>
            <animateMotion
              dur={`${2 + i * 0.4}s`}
              begin={`${1 + i * 0.2}s`}
              repeatCount="indefinite"
            >
              <mpath href={`#arp-${i}`} />
            </animateMotion>
          </circle>
        </g>
      ))}

      {/* Center: Campaign node — hub, visually distinct */}
      {/* Glow halo */}
      <rect
        x={AC_X - 4}
        y={ACY - AC_H / 2 - 4}
        width={AC_W + 8}
        height={AC_H + 8}
        rx={13}
        fill="#3c7dff"
        fillOpacity={0.08}
        stroke="none"
      />
      {/* Card */}
      <rect
        x={AC_X}
        y={ACY - AC_H / 2}
        width={AC_W}
        height={AC_H}
        rx={10}
        className="fill-fd-card"
        stroke="#3c7dff"
        strokeOpacity={0.55}
        strokeWidth={1.5}
      />
      <text
        x={ACX}
        y={ACY - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#3c7dff"
        fontSize={13}
        fontWeight={700}
        fontFamily="var(--font-sans, system-ui)"
      >
        Campaign
      </text>
      <text
        x={ACX}
        y={ACY + 9}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-fd-muted-foreground"
        fontSize={9}
        fontFamily="var(--font-sans, system-ui)"
      >
        Store Config
      </text>

      {/* Left config nodes */}
      {A_LEFT_NODES.map((node, i) => {
        const y = aLeftY(i);
        return (
          <g key={`aln-${i}`}>
            <rect
              x={AL_X}
              y={y - AL_H / 2}
              width={AL_W}
              height={AL_H}
              rx={7}
              className="fill-fd-card stroke-fd-border"
              strokeWidth={1}
            />
            <text
              x={AL_X + 10}
              y={y - 6}
              dominantBaseline="middle"
              className="fill-fd-foreground"
              fontSize={10}
              fontWeight={600}
              fontFamily="var(--font-sans, system-ui)"
            >
              {node.label}
            </text>
            <text
              x={AL_X + 10}
              y={y + 8}
              dominantBaseline="middle"
              className="fill-fd-muted-foreground"
              fontSize={8}
              fontFamily="var(--font-sans, system-ui)"
            >
              {node.sublabel}
            </text>
          </g>
        );
      })}

      {/* Next Commerce container box */}
      <rect
        x={AR_X - 10}
        y={aRightY(0) - AR_H / 2 - 28}
        width={AR_W + 20}
        height={aRightY(A_RIGHT_NODES.length - 1) - aRightY(0) + AR_H + 56}
        rx={10}
        className="stroke-fd-border"
        strokeWidth={1}
        strokeDasharray="5 3"
        fill="none"
      />
      {/* NEXT COMMERCE label pill */}
      <rect
        x={AR_X + AR_W / 2 - 44}
        y={aRightY(0) - AR_H / 2 - 27}
        width={88}
        height={16}
        rx={4}
        className="fill-fd-muted"
        fillOpacity={0.6}
      />
      <text
        x={AR_X + AR_W / 2}
        y={aRightY(0) - AR_H / 2 - 19}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-fd-muted-foreground"
        fontSize={7.5}
        fontWeight={700}
        fontFamily="var(--font-sans, system-ui)"
        letterSpacing="0.08em"
      >
        NEXT COMMERCE
      </text>

      {/* Right Next nodes */}
      {A_RIGHT_NODES.map((node, i) => {
        const y = aRightY(i);
        return (
          <g key={`arn-${i}`}>
            <rect
              x={AR_X}
              y={y - AR_H / 2}
              width={AR_W}
              height={AR_H}
              rx={7}
              className="fill-fd-card stroke-fd-border"
              strokeWidth={1}
            />
            <text
              x={AR_X + 10}
              y={y - 6}
              dominantBaseline="middle"
              className="fill-fd-foreground"
              fontSize={10}
              fontWeight={600}
              fontFamily="var(--font-sans, system-ui)"
            >
              {node.label}
            </text>
            <text
              x={AR_X + 10}
              y={y + 8}
              dominantBaseline="middle"
              className="fill-fd-muted-foreground"
              fontSize={8}
              fontFamily="var(--font-sans, system-ui)"
            >
              {node.sublabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
