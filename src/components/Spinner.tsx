import { colors } from "@/theme/colors";

interface SpinnerProps {
  isVisible: boolean;
  isOverlay?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({
  isVisible,
  isOverlay = false,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={`flex items-center justify-center ${
        isOverlay ? "fixed inset-0 bg-black/30 z-50" : ""
      }`}
    >
      <div className="relative">
        {/* Outer spinning circle */}
        <div
          className="w-12 h-12 rounded-full border-4 border-t-4 animate-spin"
          style={{
            borderColor: colors.primary,
            borderTopColor: "transparent",
          }}
        ></div>
        {/* Inner spinning circle */}
        {/* <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-t-4 border-indigo-500 border-t-transparent animate-spin animate-delay-150"></div> */}
        {/* Center dot */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
          style={{
            backgroundColor: colors.primary,
          }}
        ></div>
      </div>
    </div>
  );
};
