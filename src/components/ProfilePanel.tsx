import { useEffect, useState } from 'react';
import type { Profile } from '../types';
import { INK, PAPER, RULE } from '../types';

/* dev mock — unexported, not wired to anything */
const MOCK_PROFILE: Profile = {
  interests: ['urban transit', 'mycology', 'typography'],
  passions: ['climate adaptation', 'teaching'],
  workingOn: ['grid-scale storage', 'a battery chemistry paper'],
};

const SANS =
  '"Roboto Condensed", "Archivo Narrow", "Helvetica Neue", Helvetica, Arial, sans-serif';

/** Split on commas and newlines, trim, drop blanks. */
function parseList(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function toText(list: string[]): string {
  return list.join(', ');
}

interface FieldProps {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}

function Field({ label, hint, value, onChange }: FieldProps) {
  return (
    <label style={{ display: 'block', marginBottom: 18 }}>
      <span
        style={{
          display: 'block',
          fontFamily: SANS,
          fontSize: 12,
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
          color: INK,
          marginBottom: 5,
        }}
      >
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        spellCheck={false}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          resize: 'vertical',
          background: '#F2F3EC',
          color: INK,
          border: `1px solid ${RULE}`,
          borderRadius: 2,
          padding: '8px 9px',
          fontFamily: SANS,
          fontSize: 14,
          lineHeight: 1.45,
          outline: 'none',
        }}
      />
    </label>
  );
}

export default function ProfilePanel(props: {
  profile: Profile;
  onChange: (p: Profile) => void;
}) {
  const { profile, onChange } = props;

  const [interests, setInterests] = useState(() => toText(profile.interests));
  const [passions, setPassions] = useState(() => toText(profile.passions));
  const [workingOn, setWorkingOn] = useState(() => toText(profile.workingOn));

  /* Re-seed the drafts when the profile arrives or is replaced upstream. */
  useEffect(() => {
    setInterests(toText(profile.interests));
    setPassions(toText(profile.passions));
    setWorkingOn(toText(profile.workingOn));
  }, [profile]);

  function submit() {
    onChange({
      interests: parseList(interests),
      passions: parseList(passions),
      workingOn: parseList(workingOn),
    });
  }

  return (
    <section
      style={{
        background: PAPER,
        color: INK,
        padding: '18px 20px 20px',
        borderRight: `1px solid ${RULE}`,
      }}
    >
      <h2
        style={{
          margin: '0 0 12px',
          fontFamily: SANS,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}
      >
        You
      </h2>

      <Field label="Interested in" hint="" value={interests} onChange={setInterests} />
      <Field label="Passionate about" hint="" value={passions} onChange={setPassions} />
      <Field label="Working on now" hint="" value={workingOn} onChange={setWorkingOn} />

      <button
        type="button"
        onClick={submit}
        style={{
          width: '100%',
          background: INK,
          color: PAPER,
          border: 'none',
          borderRadius: 2,
          padding: '10px 12px',
          fontFamily: SANS,
          fontSize: 13,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        Update the map
      </button>
    </section>
  );
}

void MOCK_PROFILE;
