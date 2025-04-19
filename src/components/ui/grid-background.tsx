interface GridPaperBackgroundProps {
  gridSize?: number;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  className?: string;
}

export default function GridPaperBackground({
  gridSize = 20,
  primaryColor = "#d1d1d1",
  secondaryColor = "#e5e5e5",
  backgroundColor = "#f8f8f8",
  className = "",
}: GridPaperBackgroundProps) {
  return (
    <div
      className={`grid-paper-background ${className}`}
      style={{
        backgroundColor: backgroundColor,
        backgroundImage: `
          linear-gradient(${primaryColor} 1px, transparent 1px),
          linear-gradient(90deg, ${primaryColor} 1px, transparent 1px),
          linear-gradient(${secondaryColor} 1px, transparent 1px),
          linear-gradient(90deg, ${secondaryColor} 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px, ${gridSize / 5}px ${gridSize / 5}px, ${
          gridSize / 5
        }px ${gridSize / 5}px`,
        backgroundPosition: `-1px -1px, -1px -1px, -1px -1px, -1px -1px`,
        width: "100%",
        height: "100%",
      }}
    />
  );
}
