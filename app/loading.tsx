export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card">
            <div className="skeleton h-4 w-28" />
            <div className="mt-4 skeleton h-10 w-40" />
            <div className="mt-6 skeleton h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <div className="skeleton h-6 w-48" />
          <div className="mt-6 skeleton h-72 w-full" />
        </div>
        <div className="card">
          <div className="skeleton h-6 w-40" />
          <div className="mt-6 skeleton h-72 w-full" />
        </div>
      </div>
    </div>
  );
}
