'use client';

import { useEffect, useMemo, useState } from 'react';

export default function RotatingAnnouncement() {
  const messages = useMemo(
    () => [
      "We’re aiming to become the biggest game on the planet. You’re early. This is where it starts.",
      "We’re building toward becoming the world’s biggest game - one day at a time.",
    ],
    []
  );

  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const ROTATE_MS = 6500;
    const FADE_MS = 250;

    const t = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % messages.length);
        setShow(true);
      }, FADE_MS);
    }, ROTATE_MS);

    return () => clearInterval(t);
  }, [messages.length]);

  return (
    <span
      className={[
        'inline-block transition-opacity duration-200',
        show ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      aria-live="polite"
    >
      {messages[idx]}
    </span>
  );
}
