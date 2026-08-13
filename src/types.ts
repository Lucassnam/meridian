export type Channel =
  | 'phone' | 'email' | 'imessage' | 'whatsapp' | 'telegram' | 'signal'
  | 'linkedin' | 'instagram' | 'x' | 'discord' | 'slack' | 'substack';

export const CHANNELS: Channel[] = [
  'phone','email','imessage','whatsapp','telegram','signal',
  'linkedin','instagram','x','discord','slack','substack'
];

export type DomainId =
  | 'biotech' | 'cleanenergy' | 'ai' | 'software' | 'design' | 'capital' | 'health'
  | 'policy' | 'media' | 'academia' | 'legal' | 'ops' | 'consumer' | 'hardware';

export interface Domain { id: DomainId; label: string; angle: number; ink: string; }

export const DOMAINS: Domain[] = [
  { id:'biotech',    label:'Biotech & Life Sciences',  angle:0,     ink:'#A5442F' },
  { id:'cleanenergy',label:'Clean Energy & Climate',   angle:25.7,  ink:'#3F7167' },
  { id:'ai',         label:'AI & ML',                  angle:51.4,  ink:'#2F4A6B' },
  { id:'software',   label:'Software Engineering',     angle:77.1,  ink:'#4A5568' },
  { id:'design',     label:'Product & Design',         angle:102.9, ink:'#6B4A66' },
  { id:'capital',    label:'Capital & Investing',      angle:128.6, ink:'#B08640' },
  { id:'health',     label:'Healthcare & Medicine',    angle:154.3, ink:'#7A3F4E' },
  { id:'policy',     label:'Policy & Government',      angle:180,   ink:'#55637A' },
  { id:'media',      label:'Media & Journalism',       angle:205.7, ink:'#8C5230' },
  { id:'academia',   label:'Education & Academia',     angle:231.4, ink:'#35636E' },
  { id:'legal',      label:'Legal',                    angle:257.1, ink:'#7A5C3E' },
  { id:'ops',        label:'Operations & Supply Chain',angle:282.9, ink:'#6B7340' },
  { id:'consumer',   label:'Consumer & Retail',        angle:308.6, ink:'#96703C' },
  { id:'hardware',   label:'Hardware & Robotics',      angle:334.3, ink:'#4F6B4A' },
];

export interface Contact {
  id: string;
  name: string;
  domain: DomainId;
  subskills: string[];
  depth: 1 | 2 | 3 | 4 | 5;
  channels: Partial<Record<Channel, string>>;
  metAt?: string;
  lastContact?: string;
}

export interface PositionedContact extends Contact { x: number; y: number; }

export interface Profile { interests: string[]; passions: string[]; workingOn: string[]; }

export interface DomainScore {
  domain: DomainId;
  coverage: number;      // raw weighted units
  saturation: number;    // 0..1
  importance: number;    // 0..1
  gap: number;           // importance * (1 - saturation)
  contactCount: number;
  reason: string;        // plain-language explanation, shown in UI
}

export const PAPER = '#E8E9E1';
export const INK   = '#1B2320';
export const RULE  = '#A9AC9F';
