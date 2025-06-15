import { IMAGE_LINKS } from "@/assets/imageLinks";
import Image from "next/image";

interface FallbackImageProps {
  src?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

const FallbackImage = ({
  src,
  alt,
  width,
  height,
  className,
}: FallbackImageProps) => {
  return (
    <Image
      src={src || IMAGE_LINKS.DEFAULT_AVATAR}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
};
export default FallbackImage;
