interface SpinnerProps {
  size?: number;
}

export function Spinner({ size = 40 }: SpinnerProps) {
  return (
    <div
      className="inline-block animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"
      style={{ width: size, height: size }}
    />
  );
}
