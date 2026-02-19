import { useState, useRef, useEffect } from 'react';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allLabel: string;
  minWidth?: string;
}

export function MultiSelect({ label, options, selected, onChange, allLabel, minWidth = '180px' }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  const allSelected = selected.length === options.length && options.length > 0;
  const noneSelected = selected.length === 0;

  let buttonText: string;
  if (noneSelected) {
    buttonText = allLabel;
  } else if (selected.length === 1) {
    const match = options.find((o) => o.value === selected[0]);
    buttonText = match ? match.label : selected[0];
  } else {
    buttonText = `${selected.length} selected`;
  }

  function toggleAll() {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.value));
    }
  }

  function toggleOne(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <div ref={containerRef} className="relative" style={{ minWidth }}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full border rounded px-2 py-1.5 text-sm bg-white text-left flex items-center justify-between gap-1 ${
            noneSelected ? 'border-gray-300 text-gray-600' : 'border-blue-400 text-gray-900'
          }`}
        >
          <span className="truncate">{buttonText}</span>
          <svg className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full min-w-[200px] bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
            {/* Select All / Clear All */}
            <button
              type="button"
              onClick={toggleAll}
              className="w-full px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 text-left border-b border-gray-100"
            >
              {allSelected ? 'Clear All' : 'Select All'}
            </button>

            {options.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggleOne(opt.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="truncate">{opt.label}</span>
              </label>
            ))}

            {options.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-400 italic">No options</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
