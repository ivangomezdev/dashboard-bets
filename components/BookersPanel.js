import BookmakerName from "@/components/BookmakerName";
import { getBookmakerIcon } from "@/lib/bookmakers";
import { formatMoney } from "@/lib/format";

export default function BookersPanel({ bookers }) {
  return (
    <section className="bookers-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Bookers</span>
          <h2>Actividad por casa</h2>
        </div>
      </div>
      <div className="booker-list">
        {bookers.map((booker) => {
          const displayName = booker.baseName || booker.name.replace(/\s+-\s+VPS\s+\d+$/i, "");
          const icon = getBookmakerIcon(displayName);

          return (
            <div
              className={`booker-row ${icon ? "has-watermark" : ""}`}
              key={booker.name}
              style={icon ? { "--booker-watermark": `url(${icon})` } : undefined}
            >
              <div>
                <strong>
                  <BookmakerName name={displayName} />
                </strong>
                <span>
                  {booker.count} piernas - {booker.won} ganadas - {booker.lost} perdidas
                </span>
              </div>
              <b>{formatMoney(booker.stake)}</b>
            </div>
          );
        })}
      </div>
    </section>
  );
}
