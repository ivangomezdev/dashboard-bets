export default function Filters({ filters, onChange, options }) {
  function update(key, value) {
    onChange((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="filters">
      <label>
        Buscar
        <input
          type="search"
          value={filters.search}
          onChange={(event) => update("search", event.target.value)}
          placeholder="Evento, mercado, booker, vps o id"
        />
      </label>

      <label>
        Fecha
        <select value={filters.date} onChange={(event) => update("date", event.target.value)}>
          <option value="all">Todas</option>
          {options.dates.map((date) => (
            <option key={date} value={date}>{date}</option>
          ))}
        </select>
      </label>

      <label>
        Resultado
        <select value={filters.outcome} onChange={(event) => update("outcome", event.target.value)}>
          <option value="all">Todos</option>
          <option value="profit">Ganancia</option>
          <option value="loss">Perdida</option>
        </select>
      </label>

      <label>
        Booker
        <select value={filters.booker} onChange={(event) => update("booker", event.target.value)}>
          <option value="all">Todos</option>
          {options.bookers.map((booker) => (
            <option key={booker} value={booker}>{booker}</option>
          ))}
        </select>
      </label>

      <label>
        VPS
        <select value={filters.vps} onChange={(event) => update("vps", event.target.value)}>
          <option value="all">Todas</option>
          {options.vpses.map((vps) => (
            <option key={vps} value={vps}>{vps}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
