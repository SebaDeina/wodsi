const PATHS = {
  play: <path d="M8 5v14l11-7L8 5Z" fill="currentColor" />,
  check: <path d="M5 12.5 10 17l9-10" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  close: <path d="m7 7 10 10M17 7 7 17" />,
  reset: <path d="M5 9V4h5M5.5 9A7 7 0 1 1 5 15" />,
  home: <path d="M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4v-8.5Z" />,
  week: <path d="M5 5h14v14H5V5Zm0 5h14M10 5v14M14 5v14" />,
  timer: <path d="M9 3h6M12 13l3-3M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />,
  history: <path d="M4 12a8 8 0 1 0 2.4-5.7M4 5v5h5M12 8v5l3 2" />,
  profile: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0" />,
  dot: <circle cx="12" cy="12" r="4" fill="currentColor" />,
  water: <path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z" />,
  sleep: <path d="M17.5 15.5A7 7 0 0 1 8.5 6.5 8 8 0 1 0 17.5 15.5Z" />,
  protein: <path d="M7 8h10l-1 12H8L7 8Zm2-4h6l1 4H8l1-4Zm1 8h4" />,
  journal: <path d="M7 4h10v16H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm3 4h4M10 12h4" />,
  mobility: <path d="M12 5a2 2 0 1 0 0.01 0ZM12 8v5l-4 4M12 13l4 4M9 10h6" />,
}

export function SvgIcon({ name, size = 18, strokeWidth = 2, style, title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
    >
      {title && <title>{title}</title>}
      {PATHS[name] || PATHS.dot}
    </svg>
  )
}
