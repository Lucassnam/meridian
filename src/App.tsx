import { useMemo, useState } from 'react';
import { DOMAINS } from './types';
import type { Contact, DomainId, DomainScore, Profile } from './types';

import Chart from './components/Chart';
import GapList from './components/GapList';
import ProfilePanel from './components/ProfilePanel';
import ContactDetail from './components/ContactDetail';
import { scoreDomains } from './scoring';

/* ============================================================
   INTEGRATION SLOTS — still outstanding:
   import { SEED_CONTACTS, SEED_PROFILE } from './seed';   (Codex)
   ============================================================ */

/* ------------------------------------------------------------
   STAND-IN SEED — A1-owned.
   src/seed.ts (Codex) never landed, so the roster lives here to
   keep the demo alive. Every name is invented. Swap-out when the
   real seed arrives is two lines:
     import { SEED_CONTACTS, SEED_PROFILE } from './seed';
   ...and delete this block.

   Deliberate shape: 13 of 14 domains are populated. Clean Energy
   & Climate has ZERO contacts — that is the void the survey is
   built to expose.
   ------------------------------------------------------------ */

const c = (
  id: string,
  name: string,
  domain: DomainId,
  depth: 1 | 2 | 3 | 4 | 5,
  subskills: string[],
  channels: Contact['channels'],
  metAt: string,
  lastContact: string
): Contact => ({ id, name, domain, subskills, depth, channels, metAt, lastContact });

export const SEED_CONTACTS: Contact[] = [
  // — biotech (9) ————————————————————————————
  c('b1','Ilse Ravndal','biotech',4,['protein engineering','assay design'],{ email:'ilse@example.org', signal:'+00 000 0000' },'Cold Spring Harbor, 2024','2026-05-12'),
  c('b2','Tomas Egede','biotech',3,['CRISPR screens','assay design'],{ email:'t.egede@example.org', linkedin:'in/tomas-egede' },'lab rotation, 2021','2026-03-04'),
  c('b3','Priya Raghunath','biotech',5,['fermentation','scale-up'],{ phone:'+00 000 0001', imessage:'+00 000 0001', email:'priya@example.org' },'grad school','2026-07-19'),
  c('b4','Marek Sowa','biotech',2,['bioinformatics'],{ email:'marek@example.org' },'conference poster, 2023','2025-11-08'),
  c('b5','Hanne Dupont','biotech',3,['protein engineering'],{ email:'hanne@example.org', signal:'+00 000 0010' },'through Ilse','2026-06-22'),
  c('b6','Osman Yilmaz','biotech',1,['clinical trials'],{ linkedin:'in/osman-yilmaz' },'careers fair, 2024','2025-09-14'),
  c('b7','Beatriz Salas','biotech',4,['fermentation','process control'],{ email:'bea@example.org', whatsapp:'+00 000 0011' },'plant tour, 2023','2026-07-30'),
  c('b8','Ravi Menon','biotech',2,['bioinformatics','databases'],{ email:'ravi@example.org' },'through Marek','2026-02-28'),
  c('b9','Elsa Lindgren','biotech',3,['scale-up','process control'],{ email:'elsa@example.org', linkedin:'in/elsa-l' },'consortium, 2025','2026-05-06'),

  // — hardware & robotics (8) ————————————————
  c('h1','Wen Nakashima','hardware',5,['actuators','thermal'],{ phone:'+00 000 0002', imessage:'+00 000 0002', email:'wen@example.net' },'shop floor, 2019','2026-08-02'),
  c('h2','Dalia Okonkwo','hardware',3,['motor control','firmware'],{ email:'dalia@example.net', discord:'dalia#0000' },'robotics meetup','2026-04-21'),
  c('h3','Ferran Vidal','hardware',2,['injection moulding'],{ whatsapp:'+00 000 0003' },'supplier visit, 2022','2025-09-30'),
  c('h4','Sunniva Berg','hardware',4,['mechatronics','CAD'],{ email:'sunniva@example.net', signal:'+00 000 0004' },'former team','2026-06-11'),
  c('h5','Cato Nyland','hardware',3,['firmware','embedded'],{ email:'cato@example.net', discord:'cato#0001' },'through Dalia','2026-03-19'),
  c('h6','Ingrid Bakke','hardware',2,['CAD','industrial design'],{ email:'ingrid@example.net' },'makerspace, 2024','2025-12-27'),
  c('h7','Jomo Achieng','hardware',4,['actuators','motor control'],{ phone:'+00 000 0012', email:'jomo@example.net' },'competition, 2021','2026-07-15'),
  c('h8','Silje Aune','hardware',1,['thermal'],{ linkedin:'in/silje-aune' },'vendor day, 2025','2025-10-03'),

  // — software engineering (9) ————————————————
  c('s1','Kwame Aduba','software',4,['distributed systems'],{ email:'kwame@example.com', slack:'@kwame', discord:'kwame#0000' },'first job','2026-07-01'),
  c('s2','Renata Lindqvist','software',3,['compilers'],{ email:'renata@example.com', x:'@renatabuilds' },'open source, 2020','2026-02-14'),
  c('s3','Bo Tran','software',2,['frontend','design systems'],{ slack:'@bo' },'contract work','2025-12-02'),
  c('s4','Idris Farah','software',5,['infrastructure','databases'],{ phone:'+00 000 0005', email:'idris@example.com', signal:'+00 000 0005' },'roommate','2026-08-05'),
  c('s5','Aoife Brennan','software',3,['distributed systems','infrastructure'],{ email:'aoife@example.com', slack:'@aoife' },'through Kwame','2026-06-09'),
  c('s6','Nikhil Sethi','software',2,['embedded','firmware'],{ email:'nikhil@example.com' },'conference, 2024','2026-01-22'),
  c('s7','Greta Wallin','software',4,['frontend','prototyping'],{ email:'greta@example.com', x:'@gretaw' },'former team','2026-07-25'),
  c('s8','Musa Danjuma','software',1,['databases'],{ linkedin:'in/musa-danjuma' },'meetup, 2025','2025-08-30'),
  c('s9','Lena Fischer','software',3,['compilers','inference optimisation'],{ email:'lena@example.com', telegram:'@lenaf' },'through Renata','2026-04-27'),

  // — AI & ML (7) —————————————————————————————
  c('a1','Yuki Sorensen','ai',3,['representation learning'],{ email:'yuki@example.com', x:'@yukis' },'reading group','2026-06-28'),
  c('a2','Amara Boateng','ai',2,['evaluation','red teaming'],{ linkedin:'in/amara-boateng' },'panel, 2025','2026-01-17'),
  c('a3','Lev Petrosyan','ai',4,['inference optimisation'],{ email:'lev@example.com', telegram:'@levp' },'hackathon, 2022','2026-05-30'),
  c('a4','Noor Hadid','ai',3,['evaluation','science communication'],{ email:'noor@example.com', substack:'noorhadid' },'through Amara','2026-07-11'),
  c('a5','Tobias Wenger','ai',1,['representation learning'],{ x:'@twenger' },'talk, 2026','2026-03-08'),
  c('a6','Chiara Rossi','ai',4,['red teaming','regulatory affairs'],{ email:'chiara@example.com', signal:'+00 000 0013' },'workshop, 2023','2026-08-01'),
  c('a7','Daniel Okafor','ai',2,['inference optimisation','embedded'],{ email:'daniel@example.com' },'through Lev','2026-02-19'),

  // — capital & investing (6) ————————————————
  c('k1','Ovie Ackerman','capital',2,['seed stage','hard tech'],{ linkedin:'in/ovie-ackerman' },'introduced by Ilse','2026-01-30'),
  c('k2','Margit Halvorsen','capital',3,['deep tech','diligence'],{ email:'margit@example.vc', linkedin:'in/margit-h' },'demo day, 2024','2026-04-02'),
  c('k3','Nathan Oyelaran','capital',1,['growth'],{ linkedin:'in/nathan-o' },'cold intro','2025-08-22'),
  c('k4','Saskia Voormann','capital',4,['seed stage','diligence'],{ email:'saskia@example.vc', signal:'+00 000 0014' },'board observer','2026-07-21'),
  c('k5','Emeka Balogun','capital',2,['hard tech','supply chain'],{ email:'emeka@example.vc' },'through Margit','2026-05-18'),
  c('k6','Yara Haddad','capital',1,['growth','retail strategy'],{ linkedin:'in/yara-haddad' },'dinner, 2025','2025-11-02'),

  // — product & design (5) ————————————————————
  c('d1','Sena Kalu','design',4,['interaction design','prototyping'],{ email:'sena@example.studio', instagram:'@senakalu' },'studio collab','2026-07-08'),
  c('d2','Joakim Reuter','design',2,['industrial design'],{ email:'joakim@example.studio' },'workshop, 2023','2025-10-15'),
  c('d3','Mina Farahani','design',3,['design systems','typography'],{ email:'mina@example.studio', instagram:'@minafara' },'through Sena','2026-06-17'),
  c('d4','Ola Sandvik','design',1,['industrial design','CAD'],{ email:'ola@example.studio' },'portfolio review, 2025','2025-09-08'),
  c('d5','Thandiwe Moyo','design',3,['interaction design','research'],{ email:'thandiwe@example.studio', slack:'@thandiwe' },'former team','2026-04-30'),

  // — healthcare & medicine (5) ——————————————
  c('m1','Dr. Anneke Vos','health',3,['clinical trials'],{ email:'a.vos@example.health' },'through Priya','2026-03-27'),
  c('m2','Rashid Karim','health',2,['medical devices'],{ linkedin:'in/rashid-karim', email:'rashid@example.health' },'trade show, 2024','2025-12-19'),
  c('m3','Inga Solberg','health',4,['clinical trials','regulatory affairs'],{ email:'inga@example.health', phone:'+00 000 0015' },'trial site, 2022','2026-07-04'),
  c('m4','Paulo Ribeiro','health',1,['medical devices','mechatronics'],{ email:'paulo@example.health' },'expo, 2025','2025-10-28'),
  c('m5','Nour Chahine','health',2,['epidemiology','bioinformatics'],{ email:'nour@example.health', linkedin:'in/nour-c' },'through Anneke','2026-05-23'),

  // — academia (5) ————————————————————————————
  c('e1','Prof. Lourdes Amaya','academia',3,['materials science'],{ email:'lamaya@example.edu' },'undergrad advisor','2026-02-06'),
  c('e2','Gideon Marsh','academia',2,['science communication'],{ email:'gideon@example.edu', substack:'gideonmarsh' },'seminar, 2025','2026-05-01'),
  c('e3','Dr. Hyun-woo Park','academia',4,['materials science','thermal'],{ email:'hwpark@example.edu', signal:'+00 000 0016' },'collaboration','2026-07-27'),
  c('e4','Rosalind Achebe','academia',1,['research','epidemiology'],{ email:'rosalind@example.edu' },'guest lecture, 2025','2025-11-19'),
  c('e5','Janne Kivelä','academia',3,['research','evaluation'],{ email:'janne@example.edu', linkedin:'in/janne-k' },'review panel, 2024','2026-03-14'),

  // — media & journalism (4) ——————————————————
  c('j1','Halima Nasser','media',2,['tech reporting'],{ email:'halima@example.press', x:'@halimanasser' },'quoted me once','2026-06-03'),
  c('j2','Peter Molnar','media',1,['documentary'],{ instagram:'@petermolnar' },'party, 2023','2025-07-11'),
  c('j3','Deniz Kaya','media',3,['tech reporting','science communication'],{ email:'deniz@example.press', substack:'denizkaya' },'through Halima','2026-07-18'),
  c('j4','Astrid Holm','media',2,['typography','documentary'],{ instagram:'@astridholm', email:'astrid@example.press' },'gallery, 2024','2026-01-26'),

  // — policy & government (3) —————————————————
  c('p1','Ceren Aydin','policy',2,['regulatory affairs'],{ email:'ceren@example.gov' },'policy panel, 2025','2026-01-09'),
  c('p2','Bram de Vries','policy',3,['procurement','supply chain'],{ email:'bram@example.gov', linkedin:'in/bram-dv' },'working group','2026-06-14'),
  c('p3','Aiko Tanaka','policy',1,['regulatory affairs','IP'],{ linkedin:'in/aiko-tanaka' },'hearing, 2025','2025-09-22'),

  // — legal (3) ———————————————————————————————
  c('l1','Nadia Brekke','legal',3,['IP','patents'],{ email:'nadia@example.law', phone:'+00 000 0006' },'patent filing','2026-04-16'),
  c('l2','Victor Almeida','legal',2,['contracts','diligence'],{ email:'victor@example.law' },'through Nadia','2026-02-11'),
  c('l3','Suri Kapoor','legal',1,['patents','regulatory affairs'],{ linkedin:'in/suri-kapoor' },'seminar, 2025','2025-08-07'),

  // — operations & supply chain (3) ———————————
  c('o1','Tobias Lund','ops',2,['supply chain'],{ email:'tobias@example.com', whatsapp:'+00 000 0007' },'former vendor','2025-11-25'),
  c('o2','Grace Mwangi','ops',4,['logistics','procurement'],{ email:'grace@example.com', phone:'+00 000 0017' },'plant visit, 2022','2026-07-09'),
  c('o3','Henrik Dahl','ops',2,['supply chain','injection moulding'],{ email:'henrik@example.com' },'through Tobias','2026-03-31'),

  // — consumer & retail (5) ———————————————————
  c('r1','Mei-Ling Chow','consumer',1,['retail strategy'],{ linkedin:'in/meiling-chow' },'alumni event','2025-06-30'),
  c('r2','Diego Marchetti','consumer',3,['brand','typography'],{ email:'diego@example.com', instagram:'@diegom' },'through Mina','2026-05-27'),
  c('r3','Fatou Ndiaye','consumer',2,['retail strategy','logistics'],{ email:'fatou@example.com' },'trade show, 2024','2026-01-13'),
  c('r4','Karl Osterberg','consumer',4,['brand','research'],{ email:'karl@example.com', slack:'@karl' },'former team','2026-06-25'),
  c('r5','Leila Mansour','consumer',1,['growth'],{ linkedin:'in/leila-mansour' },'conference, 2025','2025-10-11'),

  // — cleanenergy: intentionally empty ————————
];

export const SEED_PROFILE: Profile = {
  interests: ['synthetic biology', 'protein design'],
  passions: ['building physical things', 'robotics'],
  workingOn: ['a bench-top bioreactor'],
};

/* ============================================================ */

export default function App() {
  const [contacts] = useState<Contact[]>(SEED_CONTACTS);
  const [profile, setProfile] = useState<Profile>(SEED_PROFILE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const scores = useMemo<DomainScore[]>(
    () => scoreDomains(contacts, profile),
    [contacts, profile]
  );

  const selected = useMemo(
    () => contacts.find((c) => c.id === selectedId) ?? null,
    [contacts, selectedId]
  );

  /** GapList hands back a domain; select the deepest contact in it, if any. */
  const handleSelectDomain = (d: DomainId) => {
    const first = [...contacts]
      .filter((c) => c.domain === d)
      .sort((a, b) => b.depth - a.depth)[0];
    setSelectedId(first ? first.id : null);
  };

  /* The map is the page. Everything else floats over it and stays out of the
     way until asked for. */
  return (
    <div className="paper-ground relative h-full w-full overflow-hidden">
      {/* ---- the asset, edge to edge ---- */}
      <div className="absolute inset-0">
        <Chart
          contacts={contacts}
          scores={scores}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      {/* ---- overlays. container ignores the mouse; cards claim it back ---- */}
      <div className="pointer-events-none absolute inset-0">
        <header className="absolute left-8 top-7">
          <h1
            className="text-[15px] font-semibold uppercase leading-none"
            style={{ letterSpacing: '0.42em' }}
          >
            Meridian
          </h1>
          <p className="u-label u-figure mt-2">
            {contacts.length} contacts · {DOMAINS.length} domains
          </p>
        </header>

        {/* unmapped ground — the one reading that earns permanent space */}
        <div data-panel="gaps" className="card pointer-events-auto absolute bottom-7 left-8 w-[286px]">
          <GapList scores={scores} onSelectDomain={handleSelectDomain} />
        </div>

        {/* Right side is one column, so the two cards share the height instead
            of overlapping each other on a short window. */}
        <div className="absolute bottom-7 right-8 top-7 flex w-[320px] flex-col items-end gap-3">
          {showProfile ? (
            <div
              data-panel="profile"
              className="card pointer-events-auto relative w-full"
              style={{ maxHeight: '46vh' }}
            >
              <button
                type="button"
                className="card-close"
                onClick={() => setShowProfile(false)}
                aria-label="Close"
              >
                ×
              </button>
              <ProfilePanel profile={profile} onChange={setProfile} />
            </div>
          ) : (
            <button
              type="button"
              className="pill pointer-events-auto"
              onClick={() => setShowProfile(true)}
            >
              Your bearings
            </button>
          )}

          <div className="min-h-0 flex-1" />

          {selected && (
            <div
              data-panel="detail"
              className="card pointer-events-auto relative w-full"
              style={{ maxHeight: '46vh' }}
            >
              <button
                type="button"
                className="card-close"
                onClick={() => setSelectedId(null)}
                aria-label="Close"
              >
                ×
              </button>
              <ContactDetail contact={selected} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
