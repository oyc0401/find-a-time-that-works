interface ArrowLeftSidebarIconProps {
  color?: string;
  size?: number;
}

export default function ArrowLeftSidebarIcon({
  color = "currentColor",
  size = 24,
}: ArrowLeftSidebarIconProps) {
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
        d="M7.86708 11.39L13.7691 5.783C14.2031 5.358 14.8991 5.364 15.3241 5.797C15.7491 6.231 15.7431 6.927 15.3091 7.352L10.2161 12.191L15.3281 17.048C15.7611 17.473 15.7681 18.17 15.3431 18.603C14.9181 19.037 14.2211 19.043 13.7881 18.617L7.88608 13.01C7.76708 12.893 7.68708 12.754 7.63208 12.607C7.45908 12.202 7.53408 11.717 7.86708 11.39Z"
        fill={color}
      />
    </svg>
  );
}
