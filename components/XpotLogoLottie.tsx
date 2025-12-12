return (
  <div
    className={['relative select-none', className].join(' ')}
    style={{
      width,
      height,
      minWidth: width,
      minHeight: height,
    }}
    aria-label="XPOT"
  >
    {/* Base logo – ALWAYS visible */}
    <Image
      src="/img/xpot-logo-light.png"
      alt="XPOT"
      width={width}
      height={height}
      priority
      className="absolute inset-0 object-contain"
    />

    {/* Premium glow animation */}
    <Lottie
      animationData={animationData as any}
      loop
      autoplay
      rendererSettings={{
        preserveAspectRatio: 'xMidYMid meet',
      }}
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  </div>
);
