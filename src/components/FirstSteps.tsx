/**
 * Where a first-time buyer is: Account → Agreement → Payment → Book.
 * "STEP 2 OF 4 · AGREEMENT" over a four-part bar; the step names show
 * under it on wider screens.
 */
const STEPS = ["Account", "Agreement", "Payment", "Book"] as const;

export function FirstSteps({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <nav aria-label={`Step ${current} of ${STEPS.length}: ${STEPS[current - 1]}`} className="mb-6">
      <p className="text-xs tracking-widest text-zinc-400 mb-2 text-center">
        STEP {current} OF {STEPS.length}
        <span className="text-[#c49bea] font-bold"> · {STEPS[current - 1].toUpperCase()}</span>
      </p>
      <ol className="grid grid-cols-4 gap-1.5" aria-hidden="true">
        {STEPS.map((label, i) => (
          <li key={label}>
            <span className={`block h-1 rounded-full ${i < current ? "bg-[#9954d2]" : "bg-zinc-800"}`} />
            <span
              className={`hidden sm:block text-xs tracking-wider mt-2 text-center ${
                i + 1 === current ? "text-[#c49bea] font-bold" : i + 1 < current ? "text-zinc-400" : "text-zinc-500"
              }`}
            >
              {i + 1 < current ? "✓ " : ""}
              {label.toUpperCase()}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
