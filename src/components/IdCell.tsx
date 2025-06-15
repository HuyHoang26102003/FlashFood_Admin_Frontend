import { Check, Copy } from "lucide-react";
import { useState } from "react";

const IdCell = ({ id }: { id: string }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const shortId = id?.slice(0, 8) + "...";

  const handleCopy = () => {
    navigator.clipboard.writeText(id);
    setIsCopied(true);

    // Reset after 2 seconds
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <div
      className="text-center cursor-pointer transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1 flex items-center justify-center"
      onClick={handleCopy}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered ? (
        isCopied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )
      ) : (
        shortId
      )}
    </div>
  );
};

export default IdCell;
