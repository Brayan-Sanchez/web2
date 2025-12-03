export default function PageShell({ children, center = false, full = false }){
  const centerClass = center ? "flex items-center justify-center" : "";
  const contentClass = full ? "w-full" : "w-full max-w-3xl";

  return (
    <div className={`py-8 ${centerClass}`} style={{minHeight: center ? 'calc(100vh - 160px)' : undefined}}>
      <div className={`${contentClass} mx-auto`}>{children}</div>
    </div>
  )
}
