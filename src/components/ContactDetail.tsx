import type { Channel, Contact, DomainId } from '../types';
import { CHANNELS, DOMAINS, INK, PAPER, RULE } from '../types';

/* dev mock — unexported, not wired to anything */
const MOCK_CONTACTS: Contact[] = [
  {
    id: 'c1',
    name: 'Ada Okonjo',
    domain: 'cleanenergy',
    subskills: ['grid storage', 'permitting', 'utility sales'],
    depth: 4,
    channels: {
      email: 'ada@northwind.example',
      phone: '+1 415 555 0132',
      linkedin: 'in/ada-okonjo',
      signal: 'ada.42',
    },
    metAt: 'Storage summit, Oakland',
    lastContact: 'March 2026',
  },
  {
    id: 'c2',
    name: 'Marcus Beale',
    domain: 'capital',
    subskills: ['seed checks', 'hardware diligence'],
    depth: 2,
    channels: { email: 'marcus@fabrikam.example', x: '@mbeale' },
    metAt: 'Introduced by Ada',
    lastContact: 'January 2026',
  },
  {
    id: 'c3',
    name: 'Priya Raman',
    domain: 'biotech',
    subskills: ['assay design'],
    depth: 1,
    channels: { imessage: '+1 617 555 0198' },
  },
];

const SANS =
  '"Roboto Condensed", "Archivo Narrow", "Helvetica Neue", Helvetica, Arial, sans-serif';

const MUTED = '#6C756F';
const FAINT = '#9AA298';

const CHANNEL_LABEL: Record<Channel, string> = {
  phone: 'Phone',
  email: 'Email',
  imessage: 'iMessage',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  signal: 'Signal',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  x: 'X',
  discord: 'Discord',
  slack: 'Slack',
  substack: 'Substack',
};

function domainOf(id: DomainId) {
  return DOMAINS.find((d) => d.id === id);
}

function EmptyState() {
  return (
    <section
      style={{
        background: PAPER,
        color: INK,
        padding: '20px',
        borderLeft: `1px solid ${RULE}`,
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <h2
        style={{
          margin: '0 0 8px',
          fontFamily: SANS,
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        Pick someone on the map
      </h2>
      <p
        style={{
          margin: 0,
          fontFamily: SANS,
          fontSize: 13,
          lineHeight: 1.6,
          color: MUTED,
          maxWidth: '32ch',
        }}
      >
        Their domain, what they know, how well you know them, and the channels
        you have for them open here.
      </p>
    </section>
  );
}

function DepthMeter({ depth, ink }: { depth: number; ink: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            style={{
              width: 22,
              height: 7,
              background: step <= depth ? ink : 'transparent',
              border: `1px solid ${step <= depth ? ink : RULE}`,
              borderRadius: 1,
              display: 'block',
            }}
          />
        ))}
      </div>
      <span style={{ fontFamily: SANS, fontSize: 12, color: MUTED }}>
        depth {depth} of 5
      </span>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <span
        style={{
          fontFamily: SANS,
          fontSize: 11,
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
          color: FAINT,
          marginRight: 8,
        }}
      >
        {label}
      </span>
      <span style={{ fontFamily: SANS, fontSize: 13, color: INK }}>{value}</span>
    </div>
  );
}

export default function ContactDetail(props: { contact: Contact | null }) {
  const { contact } = props;

  if (!contact) return <EmptyState />;

  const domain = domainOf(contact.domain);
  const ink = domain?.ink ?? INK;
  const recordedCount = CHANNELS.filter((c) => contact.channels[c]).length;

  return (
    <section
      style={{
        background: PAPER,
        color: INK,
        padding: '20px',
        borderLeft: `1px solid ${RULE}`,
        height: '100%',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      <h2
        style={{
          margin: '0 0 2px',
          fontFamily: SANS,
          fontSize: 21,
          fontWeight: 600,
          letterSpacing: '0.01em',
        }}
      >
        {contact.name}
      </h2>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 12,
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
          color: ink,
          marginBottom: 12,
        }}
      >
        {domain?.label ?? contact.domain}
      </div>

      {contact.subskills.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 5,
            marginBottom: 14,
          }}
        >
          {contact.subskills.map((s) => (
            <span
              key={s}
              style={{
                fontFamily: SANS,
                fontSize: 12,
                lineHeight: 1,
                padding: '5px 8px',
                border: `1px solid ${ink}`,
                borderRadius: 2,
                color: ink,
              }}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <DepthMeter depth={contact.depth} ink={ink} />
      </div>

      <div style={{ marginBottom: 18 }}>
        <Meta label="Met at" value={contact.metAt ?? 'not recorded'} />
        <Meta label="Last contact" value={contact.lastContact ?? 'not recorded'} />
      </div>

      <hr style={{ border: 'none', borderTop: `1px solid ${RULE}`, margin: '0 0 12px' }} />

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.09em',
            textTransform: 'uppercase',
          }}
        >
          Channels
        </h3>
        <span style={{ fontFamily: SANS, fontSize: 12, color: MUTED }}>
          {recordedCount} of {CHANNELS.length} recorded
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
          gap: 1,
          background: RULE,
          border: `1px solid ${RULE}`,
        }}
      >
        {CHANNELS.filter((ch) => contact.channels[ch]).map((channel) => {
          const handle = contact.channels[channel];
          return (
            <div
              key={channel}
              style={{
                background: handle ? '#F2F3EC' : PAPER,
                padding: '7px 9px',
                minHeight: 40,
              }}
            >
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 10.5,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: handle ? ink : FAINT,
                  marginBottom: 2,
                }}
              >
                {CHANNEL_LABEL[channel]}
              </div>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 13,
                  color: handle ? INK : FAINT,
                  fontStyle: handle ? 'normal' : 'italic',
                  wordBreak: 'break-all',
                }}
              >
                {handle ?? 'not recorded'}
              </div>
            </div>
          );
        })}
      </div>

      {recordedCount < CHANNELS.length && (
        <p
          style={{
            margin: '10px 0 0',
            fontFamily: SANS,
            fontSize: 11.5,
            fontStyle: 'italic',
            color: MUTED,
          }}
        >
          {CHANNELS.length - recordedCount} not recorded — ask{' '}
          {contact.name.split(' ')[0]}.
        </p>
      )}
    </section>
  );
}

void MOCK_CONTACTS;
