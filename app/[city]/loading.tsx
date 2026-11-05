export default function CityLoading() {
  return (
    <div className="hl-wrap hl-route-loading" role="status" aria-label="Loading places" aria-busy="true">
      <span className="hl-route-loading__title" />
      <span className="hl-route-loading__bar" />
      <div className="hl-route-loading__cards"><span /><span /><span /></div>
    </div>
  );
}
