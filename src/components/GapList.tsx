import { DOMAINS, INK, PAPER, RULE, type DomainId, type DomainScore } from '../types';

/* ------------------------------------------------------------------ */
/* Dev mock — not exported, not imported anywhere. Delete-safe.        */
/* ------------------------------------------------------------------ */

const MOCK_SCORES: DomainScore[] = [
  {
    domain: 'biotech',
    coverage: 0,
    saturation: 0,
    importance: 1,
    gap: 1,
    contactCount: 0,
    reason: 'Nothing recorded here, and it’s what you said you’re building in (“crispr”).',
  },
  {
    domain: 'capital',
    coverage: 1.13,
    saturation: 0.38,
    importance: 0.67,
    gap: 0.42,
    contactCount: 3,
    reason:
      '3 people here, but 2 reachable only one way. This is something you listed as a passion (“venture”).',
  },
  {
    domain: 'software',
    coverage: 2.8,
    saturation: 0.93,
    importance: 0.12,
    gap: 0.008,
    contactCount: 5,
    reason:
      '5 people here, several of them close — but nothing in your profile points this way. This is depth you aren’t using.',
  },
];

/* ------------------------------------------------------------------ */

const DOMAIN_BY_ID = new Map(DOMAINS.map((d) => [d.id, d]));

const CONDENSED =
  '"Roboto Condensed", "Archivo Narrow", "HelveticaNeue-CondensedBold", "Helvetica Neue", Helvetica, Arial, sans-serif';

function countLabel(n: number): string {
  if (n === 0) return 'no contacts';
  return `${n} contact${n === 1 ? '' : 's'}`;
}

interface GapListProps {
  scores: DomainScore[];
  onSelectDomain: (d: DomainId) => void;
}

export default function GapList({ scores, onSelectDomain }: GapListProps) {
  const rows = scores ?? [];

  /* Only ground that is actually unmapped earns a row. Domains with no gap —
     nothing recorded AND nothing in the profile pointing there — are noise. */
  const real = rows.filter((s) => s.gap > 0.004);
  const visible = (real.length >= 3 ? real : rows).slice(0, 6);
  const rest = rows.length - visible.length;

  return (
    <div
      style={{
        color: INK,
        fontFamily: CONDENSED,
        padding: '16px 18px 18px',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        .mrd-gap-row {
          width: 100%;
          display: block;
          text-align: left;
          background: transparent;
          border: 0;
          border-top: 1px solid ${RULE};
          padding: 11px 6px 12px;
          cursor: pointer;
          font: inherit;
          color: inherit;
          transition: background-color 90ms linear;
        }
        .mrd-gap-row:last-child { border-bottom: 1px solid ${RULE}; }
        .mrd-gap-row:hover { background: rgba(27, 35, 32, 0.045); }
        .mrd-gap-row:focus-visible { outline: 1px solid ${INK}; outline-offset: -1px; }
      `}</style>

      <header style={{ marginBottom: 8 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          Unmapped Ground
        </h2>
      </header>

      {rows.length === 0 && (
        <p style={{ fontSize: 12.5, opacity: 0.6, paddingTop: 12 }}>No domains to survey yet.</p>
      )}

      {visible.map((score) => {
        const domain = DOMAIN_BY_ID.get(score.domain);
        const ink = domain?.ink ?? INK;
        const label = domain?.label ?? score.domain;
        const fill = Math.max(0, Math.min(1, score.saturation));

        return (
          <button
            key={score.domain}
            type="button"
            className="mrd-gap-row"
            onClick={() => onSelectDomain(score.domain)}
            aria-label={`${label}: ${countLabel(score.contactCount)}. ${score.reason}`}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: ink,
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  opacity: score.contactCount === 0 ? 0.5 : 0.72,
                }}
              >
                {countLabel(score.contactCount)}
              </span>
            </div>

            {/* coverage bar — filled portion is saturation, the rest is the gap */}
            <div
              style={{
                position: 'relative',
                height: 6,
                margin: '7px 0 7px',
                background: 'rgba(169, 172, 159, 0.38)',
                border: `0.5px solid ${RULE}`,
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: '0 auto 0 0',
                  width: `${fill * 100}%`,
                  background: ink,
                  opacity: 0.85,
                }}
              />
            </div>

            <p
              style={{
                margin: 0,
                fontSize: 12.5,
                lineHeight: 1.38,
                letterSpacing: '0.005em',
                opacity: 0.86,
                maxWidth: '46ch',
              }}
            >
              {score.reason}
            </p>
          </button>
        );
      })}

      {rest > 0 && (
        <p
          style={{
            margin: '10px 2px 0',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: 0.45,
          }}
        >
          {rest} further {rest === 1 ? 'domain' : 'domains'} — no gap
        </p>
      )}
    </div>
  );
}
