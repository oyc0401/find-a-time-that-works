interface ArrowRightSidebarIconProps {
  color?: string;
  size?: number;
}

export default function ArrowRightSidebarIcon({
  color = "currentColor",
  size = 24,
}: ArrowRightSidebarIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={true}
    >
      <path
        d="M15.933 11.39L10.031 5.78299C9.597 5.35799 8.901 5.36399 8.476 5.79699C8.05 6.22999 8.057 6.92699 8.491 7.35199L13.584 12.191L8.472 17.048C8.039 17.473 8.032 18.17 8.457 18.603C8.882 19.037 9.579 19.043 10.012 18.617L15.914 13.01C16.033 12.893 16.113 12.754 16.168 12.607C16.341 12.202 16.266 11.717 15.933 11.39Z"
        fill={color}
      />
    </svg>
  );
}
