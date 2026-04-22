import { FileEntry } from "./types/documenthandler.types";

interface PreviewContentProps {
	file: FileEntry | null;
	zoom: number;
	currentPage: number;
	appearanceDark?: boolean;
}

export function PreviewContent({
	file,
	zoom,
	currentPage,
	appearanceDark = true,
}: PreviewContentProps) {
	const title = appearanceDark ? "text-[#cccccc]" : "text-[#333333]";
	const subC = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	const bg = appearanceDark ? "bg-[#1e1e1e]" : "bg-white";
	const borderColor = appearanceDark ? "border-[#3c3c3c]" : "border-[#e5e5e5]";

	if (!file)
		return (
			<div className={`preview-placeholder p-8 text-center ${subC}`}>
				No file selected
			</div>
		);

	const ext = file.extension.toLowerCase();

	if (ext === "pdf") {
		return (
			<div className="pdf-preview h-full w-full">
				<iframe
					title="PDF preview"
					src={`${file.path}#zoom=${zoom}&page=${currentPage}`}
					className="h-full w-full border-0"
				/>
			</div>
		);
	}

	if (["txt", "tex", "md", "json", "css", "html", "js", "ts", "tsx"].includes(ext)) {
		return (
			<div
				className={`text-preview max-h-[60vh] overflow-auto rounded-lg border p-4 ${bg} ${borderColor}`}
				style={{ zoom: `${zoom}%` }}
			>
				<pre className={`text-sm ${title}`}>
					{/* Placeholder - in real app, fetch file content */}
					Content of {file.name} would be displayed here.
				</pre>
			</div>
		);
	}

	if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(ext)) {
		return (
			<div
				className="image-preview text-center"
				style={{ zoom: `${zoom}%` }}
			>
				<img
					src={file.path}
					alt={file.name}
					className="max-h-[60vh] max-w-full rounded-lg"
				/>
			</div>
		);
	}

	return (
		<div
			className={`generic-preview rounded-lg border p-6 ${bg} ${borderColor}`}
		>
			<div className={`file-info flex flex-col gap-2 ${title}`}>
				<h3 className="text-lg font-semibold">{file.name}</h3>
				<p className={subC}>
					Type: {file.extension.toUpperCase()}
				</p>
				<p className={subC}>
					Size: {(file.size / 1024).toFixed(1)} KB
				</p>
				<p className={subC}>
					Modified: {new Date(file.modified).toLocaleString()}
				</p>
			</div>
		</div>
	);
}

export default PreviewContent;