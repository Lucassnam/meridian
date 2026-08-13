import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import { DOMAINS, INK, RULE, type Contact, type DomainScore } from '../types';

/* ------------------------------------------------------------------ *
 * An organic graph, not a target. You sit at the centre; each domain
 * hangs off you; each person hangs off their domain. A domain with no
 * one attached is left hanging alone — that is the whole point.
 * ------------------------------------------------------------------ */

const CONDENSED =
  '"Archivo Narrow", "Roboto Condensed", "Arial Narrow", system-ui, sans-serif';

const YOU_R = 13;
const HUB_R = 7;
const LINK_W = 0.8;
const RANGE_RINGS = [110, 200, 290, 380];

type Kind = 'you' | 'domain' | 'contact';

interface GNode extends SimulationNodeDatum {
  id: string;
  kind: Kind;
  label: string;
  ink: string;
  r: number;
  empty?: boolean;
  contact?: Contact;
}

interface GLink extends SimulationLinkDatum<GNode> {
  kind: 'spoke' | 'branch' | 'affinity';
  dist: number;
  str: number;
}

/* Deterministic jitter — a re-render must not reshuffle the map. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
/** Stable pseudo-random in [-1, 1) for a given key. */
function wobble(key: string): number {
  return ((hash(key) % 2000) / 1000) - 1;
}

function useContainerSize(ref: RefObject<HTMLDivElement>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) setSize({ w: Math.round(box.width), h: Math.round(box.height) });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export default function Chart(props: {
  contacts: Contact[];
  scores: DomainScore[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const didFit = useRef(false);

  const size = useContainerSize(wrapRef);
  const reduced = useReducedMotion();
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);

  const nodesRef = useRef<GNode[]>([]);
  const linksRef = useRef<GLink[]>([]);
  const [, setFrame] = useState(0);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const contacts = props.contacts;
  const sig = contacts.map((c) => `${c.id}:${c.domain}:${c.depth}`).join('|');

  /* --- build the graph ------------------------------------------- */
  const graph = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of contacts) counts.set(c.domain, (counts.get(c.domain) ?? 0) + 1);

    /* You are pinned to the origin — the plane is centred on you, and the
       range rings stay meaningful because the centre never drifts. */
    const nodes: GNode[] = [
      { id: '__you', kind: 'you', label: 'YOU', ink: INK, r: YOU_R, fx: 0, fy: 0 },
    ];
    const links: GLink[] = [];

    /* Hubs sit at a distance set by how populated they are — ground you know
       well pulls in close, thin ground drifts to the rim — plus a fixed
       wobble so the fourteen of them never form a clean wheel. */
    for (const d of DOMAINS) {
      const n = counts.get(d.id) ?? 0;
      nodes.push({
        id: `d:${d.id}`,
        kind: 'domain',
        label: d.label,
        ink: d.ink,
        r: HUB_R + Math.min(6, n * 0.5),
        empty: n === 0,
      });
      links.push({
        source: '__you',
        target: `d:${d.id}`,
        kind: 'spoke',
        dist: 158 + (1 - Math.min(1, n / 8)) * 98 + wobble(`s${d.id}`) * 34,
        str: 0.2,
      });
    }

    for (const c of contacts) {
      const d = DOMAINS.find((x) => x.id === c.domain) ?? DOMAINS[0];
      nodes.push({
        id: `c:${c.id}`,
        kind: 'contact',
        label: c.name,
        ink: d.ink,
        r: 3.6 + c.depth * 1.15,
        contact: c,
      });
      links.push({
        source: `d:${c.domain}`,
        target: `c:${c.id}`,
        kind: 'branch',
        dist: 24 + (5 - c.depth) * 11 + wobble(`b${c.id}`) * 12,
        str: 0.5,
      });
    }

    /* Affinity: people who share a subskill are tied to each other, which
       drags clusters across domain lines and kills the hub-and-spoke look.
       Chained, not cliqued — a clique of 6 is a hairball. */
    const bySkill = new Map<string, string[]>();
    for (const c of contacts) {
      for (const s of c.subskills) {
        const key = s.toLowerCase().trim();
        const list = bySkill.get(key) ?? [];
        list.push(c.id);
        bySkill.set(key, list);
      }
    }
    for (const [skill, ids] of bySkill) {
      if (ids.length < 2 || ids.length > 6) continue;
      for (let i = 1; i < ids.length; i++) {
        links.push({
          source: `c:${ids[i - 1]}`,
          target: `c:${ids[i]}`,
          kind: 'affinity',
          dist: 56 + wobble(`a${skill}${i}`) * 16,
          str: 0.055,
        });
      }
    }

    return { nodes, links };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  /* --- simulate --------------------------------------------------- */
  useEffect(() => {
    const nodes = graph.nodes.map((n) => ({ ...n }));
    const links = graph.links.map((l) => ({ ...l }));
    nodesRef.current = nodes;
    linksRef.current = links;

    const sim = forceSimulation<GNode>(nodes)
      .force(
        'link',
        forceLink<GNode, GLink>(links)
          .id((d) => d.id)
          .distance((l) => l.dist)
          .strength((l) => l.str)
      )
      .force(
        'charge',
        forceManyBody<GNode>().strength((d) =>
          d.kind === 'contact'
            ? -96 + wobble(d.id) * 30
            : d.kind === 'domain'
              ? -640 + wobble(d.id) * 130
              : -700
        )
      )
      /* Hubs carry a label, so they claim far more space than their dot —
         otherwise fourteen domain names pile on top of each other. */
      .force(
        'collide',
        forceCollide<GNode>((d) =>
          d.kind === 'domain' ? 58 : d.kind === 'you' ? 34 : d.r + 12
        ).strength(0.9)
      )
      .alphaDecay(0.035)
      .stop();

    if (reduced) {
      sim.tick(400);
      setFrame((f) => f + 1);
      return () => sim.stop();
    }

    sim.on('tick', () => setFrame((f) => f + 1));
    sim.restart();
    return () => {
      sim.on('tick', null);
      sim.stop();
    };
  }, [graph, reduced]);

  /* --- pan / zoom -------------------------------------------------- */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const zb = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (e) => setTransform(e.transform));
    zoomRef.current = zb;
    const sel = select(svg);
    sel.call(zb);
    sel.on('dblclick.zoom', null);
    return () => {
      sel.on('.zoom', null);
      zoomRef.current = null;
    };
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    const zb = zoomRef.current;
    if (!svg || !zb || didFit.current || size.w === 0 || size.h === 0) return;
    didFit.current = true;
    const k = Math.min(1.3, Math.max(0.4, Math.min(size.w, size.h) / 780));
    select(svg).call(
      zb.transform,
      zoomIdentity.translate(size.w / 2, size.h / 2).scale(k)
    );
  }, [size.w, size.h]);

  const nodes = nodesRef.current;
  const links = linksRef.current;
  /* Names are noise at rest — 30 of them overlap into mush. They appear on
     hover, on selection, or when you have zoomed in far enough to want them. */
  const showNames = transform.k >= 1.9;

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        ref={svgRef}
        width={size.w || '100%'}
        height={size.h || '100%'}
        style={{ display: 'block', cursor: 'grab', touchAction: 'none' }}
      >
        <g transform={transform.toString()}>
          {/* the plane: faint range rings centred on you, reference only */}
          <g fill="none" stroke={RULE} strokeWidth={0.7} strokeDasharray="2 5">
            {RANGE_RINGS.map((r) => (
              <circle
                key={r}
                r={r}
                cx={0}
                cy={0}
                strokeOpacity={0.85}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>

          {/* threads */}
          <g stroke={RULE} strokeWidth={LINK_W} fill="none">
            {links.map((l, i) => {
              const s = l.source as GNode;
              const t = l.target as GNode;
              if (typeof s !== 'object' || typeof t !== 'object') return null;
              const op =
                l.kind === 'spoke' ? 0.4 : l.kind === 'branch' ? 0.55 : 0.28;
              return (
                <line
                  key={i}
                  x1={s.x ?? 0}
                  y1={s.y ?? 0}
                  x2={t.x ?? 0}
                  y2={t.y ?? 0}
                  strokeOpacity={op}
                  strokeDasharray={l.kind === 'affinity' ? '1.5 3' : undefined}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </g>

          {/* nodes */}
          <g>
            {nodes.map((n) => {
              const selected =
                n.kind === 'contact' && n.contact?.id === props.selectedId;
              const isContact = n.kind === 'contact';
              const hovered = hoverId === n.id;
              return (
                <g
                  key={n.id}
                  data-kind={n.kind}
                  transform={`translate(${(n.x ?? 0).toFixed(2)},${(n.y ?? 0).toFixed(2)})`}
                  onClick={
                    isContact && n.contact
                      ? () => props.onSelect(n.contact!.id)
                      : undefined
                  }
                  onMouseEnter={isContact ? () => setHoverId(n.id) : undefined}
                  onMouseLeave={isContact ? () => setHoverId(null) : undefined}
                  style={{ cursor: isContact ? 'pointer' : 'default' }}
                >
                  {selected && (
                    <circle
                      r={n.r + 5}
                      fill="none"
                      stroke={INK}
                      strokeWidth={1.1}
                      vectorEffect="non-scaling-stroke"
                    />
                  )}

                  <circle
                    r={n.r}
                    fill={n.empty ? 'none' : n.ink}
                    stroke={n.empty ? n.ink : 'none'}
                    strokeWidth={n.empty ? 1.1 : 0}
                    strokeDasharray={n.empty ? '2 2.5' : undefined}
                    vectorEffect="non-scaling-stroke"
                  />

                  {n.kind === 'domain' && (
                    <text
                      y={n.r + 11}
                      textAnchor="middle"
                      fill={INK}
                      fillOpacity={n.empty ? 0.75 : 0.6}
                      fontFamily={CONDENSED}
                      fontSize={10}
                      letterSpacing={1.1}
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >
                      {n.label.toUpperCase()}
                    </text>
                  )}

                  {n.kind === 'you' && (
                    /* Above the node: hub labels all sit below theirs, and a
                       hub can drift close enough to collide down there. */
                    <text
                      y={-(n.r + 9)}
                      textAnchor="middle"
                      fill={INK}
                      fontFamily={CONDENSED}
                      fontSize={11.5}
                      letterSpacing={2.4}
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >
                      YOU
                    </text>
                  )}

                  {isContact && (showNames || selected || hovered) && (
                    <text
                      y={n.r + 10}
                      textAnchor="middle"
                      fill={INK}
                      fillOpacity={selected || hovered ? 0.95 : 0.55}
                      fontFamily={CONDENSED}
                      fontSize={9}
                      letterSpacing={0.5}
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >
                      {n.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
}
