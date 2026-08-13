import {
  CHANNELS,
  DOMAINS,
  type Channel,
  type Contact,
  type DomainId,
  type DomainScore,
  type Profile,
} from './types';
import { KEYWORDS } from './keywords';

/* ------------------------------------------------------------------ */
/* Model constants                                                     */
/* ------------------------------------------------------------------ */

/** depth 1..5 -> weight. A 5 is worth five times a 1. */
const DEPTH_WEIGHT = [0.2, 0.4, 0.6, 0.8, 1.0] as const;

/** Coverage units at which a domain counts as fully saturated. */
/* Calibrated for roster size: ~3.0 suits a 30-person network, but at ~70
   contacts every domain pinned to saturation 1.0 and every gap collapsed to
   zero. 6.0 keeps saturation in a band where gaps still discriminate. */
const SATURATION_TARGET = 6.0;

/** Channels beyond this add no further reach. */
const REACH_TARGET = 3;

/** Terms this short are matched on word boundaries, not as substrings. */
const SHORT_TERM_MAX = 3;

const BUCKET_WEIGHT = { workingOn: 3, passions: 2, interests: 1 } as const;

/**
 * Coverage is a sum of floats, so a domain that is exactly saturated can land
 * at 0.7999999999999999 and fall through the "well covered" branch into the
 * hedging one. Compare against thresholds with a tolerance.
 */
const EPS = 1e-9;

/* ------------------------------------------------------------------ */
/* Coverage                                                            */
/* ------------------------------------------------------------------ */

export function depthWeight(depth: Contact['depth']): number {
  return DEPTH_WEIGHT[depth - 1] ?? DEPTH_WEIGHT[0];
}

/** Number of channels actually recorded for a contact. */
export function channelCount(contact: Contact): number {
  const channels = contact.channels ?? {};
  return CHANNELS.reduce((n, ch: Channel) => {
    const handle = channels[ch];
    return n + (typeof handle === 'string' && handle.trim() !== '' ? 1 : 0);
  }, 0);
}

/**
 * The point of the whole model: a deep contact you can only reach one way is
 * a weaker asset than the same person with three live channels.
 *
 *   1 channel  -> 0.733    2 channels -> 0.867    3+ channels -> 1.0
 *
 * Floor of 0.6 because someone you know is still worth something even if the
 * only way to reach them is a phone number you're not sure still works.
 */
export function reachFactor(contact: Contact): number {
  return 0.6 + 0.4 * Math.min(channelCount(contact) / REACH_TARGET, 1);
}

function contactWeight(contact: Contact): number {
  return depthWeight(contact.depth) * reachFactor(contact);
}

/* ------------------------------------------------------------------ */
/* Keyword matching — deterministic, offline                           */
/* ------------------------------------------------------------------ */

const boundaryCache = new Map<string, RegExp>();

function boundaryRegex(term: string): RegExp {
  let re = boundaryCache.get(term);
  if (!re) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`);
    boundaryCache.set(term, re);
  }
  return re;
}

/**
 * Case-insensitive substring match, with one guard: terms of three characters
 * or fewer ('ai', 'ml', 'vc') require word boundaries, so 'ai' does not fire
 * on 'email' and 'ops' does not fire on 'shops'.
 */
function termMatches(term: string, haystack: string): boolean {
  if (term.length <= SHORT_TERM_MAX) return boundaryRegex(term).test(haystack);
  return haystack.includes(term);
}

/** Distinct keywords of `domain` that appear anywhere in `entries`. */
function matchedTerms(entries: string[] | undefined, domain: DomainId): string[] {
  if (!entries?.length) return [];
  const terms = KEYWORDS[domain] ?? [];
  const haystacks = entries
    .filter((e) => typeof e === 'string' && e.trim() !== '')
    .map((e) => e.toLowerCase());
  if (!haystacks.length) return [];
  return terms.filter((term) => haystacks.some((h) => termMatches(term, h)));
}

interface ProfileHits {
  workingOn: string[];
  passions: string[];
  interests: string[];
  raw: number;
}

function profileHits(profile: Profile | undefined, domain: DomainId): ProfileHits {
  const workingOn = matchedTerms(profile?.workingOn, domain);
  const passions = matchedTerms(profile?.passions, domain);
  const interests = matchedTerms(profile?.interests, domain);
  return {
    workingOn,
    passions,
    interests,
    raw:
      BUCKET_WEIGHT.workingOn * workingOn.length +
      BUCKET_WEIGHT.passions * passions.length +
      BUCKET_WEIGHT.interests * interests.length,
  };
}

function profileIsEmpty(profile: Profile | undefined): boolean {
  const all = [
    ...(profile?.workingOn ?? []),
    ...(profile?.passions ?? []),
    ...(profile?.interests ?? []),
  ];
  return all.every((e) => typeof e !== 'string' || e.trim() === '');
}

/* ------------------------------------------------------------------ */
/* Reason strings — the product's actual output                        */
/* ------------------------------------------------------------------ */

function quote(term: string): string {
  return `“${term}”`;
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/**
 * The most specific matched term reads best in a reason string: quoting
 * "crispr" lands, quoting "gene" sounds like the machine guessed. Longest
 * match wins, ties broken by keyword-list order so it stays deterministic.
 */
function sharpest(terms: string[]): string {
  return terms.reduce((best, t) => (t.length > best.length ? t : best), terms[0]);
}

/** "what you said you're building in ('crispr')" — strongest bucket wins. */
function driverPhrase(hits: ProfileHits): string | null {
  if (hits.workingOn.length) {
    return `what you said you’re building in (${quote(sharpest(hits.workingOn))})`;
  }
  if (hits.passions.length) {
    return `something you listed as a passion (${quote(sharpest(hits.passions))})`;
  }
  if (hits.interests.length) {
    return `an interest you listed (${quote(sharpest(hits.interests))})`;
  }
  return null;
}

interface ReasonInput {
  contacts: Contact[];
  saturation: number;
  importance: number;
  hits: ProfileHits;
  profileEmpty: boolean;
}

function buildReason({
  contacts,
  saturation,
  importance,
  hits,
  profileEmpty,
}: ReasonInput): string {
  const n = contacts.length;
  const driver = driverPhrase(hits);
  const people = `${n} ${plural(n, 'person', 'people')}`;

  /* --- Case 1: nothing here at all ------------------------------------ */
  if (n === 0) {
    if (hits.workingOn.length) {
      return `Nothing recorded here, and it’s ${driver}.`;
    }
    if (driver) {
      return `No one recorded here — and this is ${driver}.`;
    }
    if (profileEmpty) {
      return 'Nothing recorded here. Fill in your profile and this will tell you whether that matters.';
    }
    return 'Nothing recorded here, and nothing in your profile points this way either.';
  }

  const avgDepth = contacts.reduce((s, c) => s + c.depth, 0) / n;
  const avgChannels = contacts.reduce((s, c) => s + channelCount(c), 0) / n;
  const deepButUnreachable = contacts.filter(
    (c) => c.depth >= 4 && channelCount(c) <= 1,
  ).length;
  const singleChannel = contacts.filter((c) => channelCount(c) <= 1).length;

  /* --- Case 2: covered on paper, but you can barely reach them --------- */
  if (deepButUnreachable > 0 && avgChannels < 2 && saturation < 0.85 - EPS) {
    const who = deepButUnreachable === 1 ? 'One of them' : `${deepButUnreachable} of them`;
    const tail = driver ? ` This is ${driver}.` : '';
    return `${who} you know well, but with only one way to get in touch. Ask for a second channel and this domain gets stronger without meeting anyone new.${tail}`;
  }

  /* --- Case 3: several shallow contacts -------------------------------- */
  if (saturation < 0.35 - EPS) {
    if (avgDepth <= 2) {
      const tail = driver
        ? ` Thin ground for ${driver}.`
        : ' None of them close enough to ask for anything.';
      return `${people} here, all acquaintances.${tail}`;
    }
    return driver
      ? `${people} here — not enough for ${driver}.`
      : `${people} here, and thin cover overall.`;
  }

  /* --- Case 4: well covered -------------------------------------------- */
  if (saturation >= 0.8 - EPS) {
    if (importance < 0.2) {
      return `${people} here, several of them close — but nothing in your profile points this way. This is depth you aren’t using.`;
    }
    return `Well covered: ${people}, close enough and reachable. ${
      driver ? `Matches ${driver}.` : 'No obvious gap here.'
    }`;
  }

  /* --- Case 5: partial cover ------------------------------------------- */
  if (singleChannel >= Math.ceil(n / 2)) {
    return `${people} here, but ${singleChannel === n ? 'each' : `${singleChannel}`} reachable only one way.${
      driver ? ` This is ${driver}.` : ''
    }`;
  }
  return driver
    ? `${people} here — real cover, but light for ${driver}.`
    : `${people} here. Moderate cover, no strong pull from your profile.`;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export function scoreDomains(contacts: Contact[], profile: Profile): DomainScore[] {
  const list = Array.isArray(contacts) ? contacts : [];
  const byDomain = new Map<DomainId, Contact[]>();
  for (const d of DOMAINS) byDomain.set(d.id, []);
  for (const c of list) {
    const bucket = byDomain.get(c.domain);
    if (bucket) bucket.push(c);
  }

  const hitsByDomain = new Map<DomainId, ProfileHits>();
  let maxRaw = 0;
  for (const d of DOMAINS) {
    const hits = profileHits(profile, d.id);
    hitsByDomain.set(d.id, hits);
    if (hits.raw > maxRaw) maxRaw = hits.raw;
  }

  // Fallback: with no profile entries (or no keyword hits at all) there is no
  // basis to rank relevance, so every domain is equally important and the gap
  // view degrades to pure coverage. This is what makes the view work before
  // the profile panel exists.
  const profileEmpty = profileIsEmpty(profile);
  const noSignal = maxRaw === 0;

  const scores: DomainScore[] = DOMAINS.map((d) => {
    const domainContacts = byDomain.get(d.id) ?? [];
    const coverage = domainContacts.reduce((sum, c) => sum + contactWeight(c), 0);
    const saturation = Math.min(coverage / SATURATION_TARGET, 1);
    const hits = hitsByDomain.get(d.id)!;
    const importance = noSignal ? 1 : hits.raw / maxRaw;

    return {
      domain: d.id,
      coverage,
      saturation,
      importance,
      gap: importance * (1 - saturation),
      contactCount: domainContacts.length,
      reason: buildReason({
        contacts: domainContacts,
        saturation,
        importance,
        hits,
        profileEmpty,
      }),
    };
  });

  // Gap descending; ties broken by thinner coverage first, then stable by the
  // canonical DOMAINS order so the list never jitters between renders.
  const order = new Map(DOMAINS.map((d, i) => [d.id, i]));
  return scores.sort(
    (a, b) =>
      b.gap - a.gap ||
      a.coverage - b.coverage ||
      order.get(a.domain)! - order.get(b.domain)!,
  );
}
