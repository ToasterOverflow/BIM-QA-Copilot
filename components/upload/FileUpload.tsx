"use client";

import { useRef, useState } from "react";
import { SAMPLE_DATASETS } from "@/lib/sample-data";
import { Button } from "@/components/ui/Button";

interface FileUploadProps {
  onFileText(text: string, fileName: string): void;
  onError(message: string): void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".csv", ".tsv", ".txt"];

function hasAllowedExtension(fileName: string): boolean {
  return ALLOWED_EXTENSIONS.some((extension) =>
    fileName.toLowerCase().endsWith(extension),
  );
}

export function FileUpload({ onFileText, onError }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    if (!hasAllowedExtension(file.name)) {
      onError("Unsupported file type. Upload a .csv, .tsv, or .txt file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      onError("File too large (max 10 MB)");
      return;
    }

    try {
      onFileText(await file.text(), file.name);
    } catch {
      onError("Could not read the file. Check permissions and try again.");
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-100 p-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
        className={`rounded-md border border-dashed px-5 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 ${
          isDragging
            ? "border-slate-700 bg-slate-200"
            : "border-slate-300 bg-slate-50 hover:bg-slate-100"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.txt,text/csv"
          className="hidden"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        <p className="text-sm font-medium text-slate-950">
          Drop a Revit CSV export here, or click to choose a file
        </p>
        <p className="mt-1 text-sm text-slate-600">CSV, TSV, or TXT up to 10 MB.</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-600">or try a sample:</span>
        {SAMPLE_DATASETS.map((sample) => (
          <Button
            key={sample.id}
            variant="secondary"
            onClick={() => onFileText(sample.csv, `${sample.label}.csv`)}
          >
            {sample.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
