// Einfaldir formreitir (server components).

type Opt = Record<string, string>;

export function Text({ name, label, defaultValue, type = "text", required, placeholder, inputMode, className }: {
  name: string; label: string; defaultValue?: string | number | null; type?: string; required?: boolean;
  placeholder?: string; inputMode?: "numeric" | "decimal" | "tel" | "email"; className?: string;
}) {
  return (
    <div className={className}>
      <label className="lbl" htmlFor={name}>{label}{required && " *"}</label>
      <input className="input" id={name} name={name} type={type} defaultValue={defaultValue ?? ""} required={required} placeholder={placeholder} inputMode={inputMode} />
    </div>
  );
}

export function Area({ name, label, defaultValue, rows = 3, className }: { name: string; label: string; defaultValue?: string | null; rows?: number; className?: string }) {
  return (
    <div className={className}>
      <label className="lbl" htmlFor={name}>{label}</label>
      <textarea className="input" id={name} name={name} rows={rows} defaultValue={defaultValue ?? ""} />
    </div>
  );
}

export function Select({ name, label, options, defaultValue, empty, required, className }: {
  name: string; label: string; options: Opt; defaultValue?: string | null; empty?: string; required?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <label className="lbl" htmlFor={name}>{label}{required && " *"}</label>
      <select className="input" id={name} name={name} defaultValue={defaultValue ?? ""} required={required}>
        {empty !== undefined && <option value="">{empty}</option>}
        {Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    </div>
  );
}

export function Checks({ name, label, options, selected }: { name: string; label: string; options: Opt; selected: string[] }) {
  return (
    <fieldset>
      <legend className="lbl">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {Object.entries(options).map(([k, v]) => (
          <label key={k} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
            <input type="checkbox" name={name} value={k} defaultChecked={selected.includes(k)} className="accent-brand-500" />
            {v}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-brand-500" />
      {label}
    </label>
  );
}
