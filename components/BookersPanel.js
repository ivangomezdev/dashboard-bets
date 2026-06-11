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
        {bookers.map((booker) => (
          <div className="booker-row" key={booker.name}>
            <div>
              <strong>{booker.name}</strong>
              <span>{booker.count} piernas · {booker.won} ganadas · {booker.lost} perdidas</span>
            </div>
            <b>{formatMoney(booker.stake)}</b>
          </div>
        ))}
      </div>
    </section>
  );
}
