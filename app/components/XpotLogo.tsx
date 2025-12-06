import Image from 'next/image';

type XpotLogoProps = {
  variant?: 'light' | 'dark' | 'mark';
  width?: number;
  height?: number;
  className?: string;
};

export default function XpotLogo({
  variant = 'light',
  width,
  height,
  className,
}: XpotLogoProps) {
  let src = '/img/xpot-logo-light.png';

  if (variant === 'dark') src = '/img/xpot-black.png';
  if (variant === 'mark') src = '/img/xpot-mark.png';

  const w = width ?? (variant === 'mark' ? 28 : 140);
  const h = height ?? (variant === 'mark' ? 28 : 40);

  return (
    <Image
      src={src}
      alt="XPOT"
      width={w}
      height={h}
      className={className}
      priority
    />
  );
}
