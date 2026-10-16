import Image from "next/image";

export default function BrandLogo({ className = "h-11 w-[178px]" }: { className?: string }) {
  return (
    <Image
      alt="Help Study Abroad"
      className={`object-contain object-left ${className}`}
      height={126}
      priority
      src="/help-study-abroad-logo.svg"
      width={500}
    />
  );
}
