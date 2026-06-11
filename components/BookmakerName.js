import { getBookmakerIcon } from "@/lib/bookmakers";

export default function BookmakerName({ name, className = "" }) {
  const icon = getBookmakerIcon(name);

  return (
    <span className={`bookmaker-name ${className}`}>
      {icon ? <img src={icon} alt="" aria-hidden="true" /> : <span className="bookmaker-fallback" />}
      <span>{name || "Sin booker"}</span>
    </span>
  );
}
