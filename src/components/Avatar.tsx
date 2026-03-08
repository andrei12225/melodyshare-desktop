import { useState, useEffect } from "react";
import { RiUser3Fill } from "react-icons/ri";

interface AvatarProps {
  url?: string | null;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

export default function Avatar({ url, alt = "User", size = "md", className = "" }: AvatarProps) {
  const [error, setError] = useState(false);

  // Reset error if url changes
  useEffect(() => {
    setError(false);
  }, [url]);

  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-16 h-16",
    "2xl": "w-24 h-24"
  };

  const containerClasses = `${sizeClasses[size]} bg-zinc-700 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`;

  if (url && !error) {
    return (
      <div className={containerClasses}>
        <img 
          src={url} 
          alt={alt} 
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <RiUser3Fill className="text-zinc-400 w-1/2 h-1/2" />
    </div>
  );
}
