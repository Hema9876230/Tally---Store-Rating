export default function DataTable({ columns, rows, sort, order, onSort, loading, empty = 'Nothing to show yet.', onRowClick }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort === c.key;
              return (
                <th key={c.key} aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {c.sortable === false ? c.label : (
                    <button className="th-btn" onClick={() => onSort(c.key)}>
                      {c.label}
                      <span className={`caret ${active ? order : ''}`} aria-hidden="true" />
                    </button>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading && !rows.length ? (
            <tr><td className="empty" colSpan={columns.length}>Loading…</td></tr>
          ) : rows.length ? (
            rows.map((r, i) => (
              <tr
                key={r.id ?? `${r.store_id}-${r.user_id}-${i}`}
                className={onRowClick ? 'clickable' : ''}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(r) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
              >
                {columns.map((c) => <td key={c.key} data-label={c.label}>{c.render ? c.render(r) : r[c.key]}</td>)}
              </tr>
            ))
          ) : (
            <tr><td className="empty" colSpan={columns.length}>{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
