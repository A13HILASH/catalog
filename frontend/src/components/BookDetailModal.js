import React, { useState, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import jsPDF from "jspdf";

// ✅ Fix PDF worker (no more fake worker error)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/* ---------------- Advanced PDF Viewer ---------------- */
const AdvancedPDFViewer = ({ pdfUrl }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.1);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages || 1);
    setPageNumber(1);
  };

  return (
    <div className="flex flex-col h-full">
      {/* PDF content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 flex justify-center p-4">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="text-slate-600">Loading PDF…</div>}
          error={<div className="text-red-600">Failed to load PDF.</div>}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer
            renderAnnotationLayer
            className="shadow-lg rounded bg-white"
          />
        </Document>
      </div>

      {/* Navigation */}
      <div className="px-4 py-2 bg-gray-100 flex items-center justify-between border-t">
        <button
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-700">
          Page {Math.min(pageNumber, numPages || 1)} of {numPages || "…"}
        </span>
        <button
          onClick={() => setPageNumber((p) => Math.min((numPages || 1), p + 1))}
          disabled={!numPages || pageNumber >= numPages}
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Zoom controls */}
      <div className="px-4 py-2 bg-gray-100 flex items-center justify-center gap-2 border-t">
        <button
          onClick={() =>
            setScale((s) => Math.max(0.6, Number((s - 0.2).toFixed(2))))
          }
          className="px-2 py-1 bg-gray-300 hover:bg-gray-400 rounded"
        >
          –
        </button>
        <span>{Math.round(scale * 100)}%</span>
        <button
          onClick={() =>
            setScale((s) => Math.min(3, Number((s + 0.2).toFixed(2))))
          }
          className="px-2 py-1 bg-gray-300 hover:bg-gray-400 rounded"
        >
          +
        </button>
      </div>
    </div>
  );
};

/* ---------------- Markdown Renderer ---------------- */
const MarkdownRenderer = ({ content }) => {
  const [html, setHtml] = useState("");

  useEffect(() => {
    const text = content || "";
    const escape = (s) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const mdToHtml = (t) =>
      t
        .replace(
          /^### (.*$)/gm,
          '<h3 class="text-lg font-semibold text-slate-800 mt-4 mb-2">$1</h3>'
        )
        .replace(
          /^## (.*$)/gm,
          '<h2 class="text-xl font-semibold text-slate-800 mt-6 mb-3">$1</h2>'
        )
        .replace(
          /^# (.*$)/gm,
          '<h1 class="text-2xl font-bold text-slate-900 mt-6 mb-4">$1</h1>'
        )
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        .replace(
          /```([\s\S]*?)```/g,
          '<pre class="bg-slate-100 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm">$1</code></pre>'
        )
        .replace(
          /`(.*?)`/g,
          '<code class="bg-slate-100 px-1 py-0.5 rounded text-sm">$1</code>'
        )
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800 underline">$1</a>'
        )
        .replace(/\n\n/g, "</p><p class='mb-4'>")
        .replace(/\n/g, "<br>");

    const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(text.trim());
    setHtml(looksLikeHtml ? text : mdToHtml(escape(text)));
  }, [content]);

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div
        className="prose prose-lg max-w-4xl mx-auto px-6 py-8"
        dangerouslySetInnerHTML={{
          __html: html || "<p>No content.</p>",
        }}
      />
    </div>
  );
};

/* ---------------- Helper: Download Markdown as PDF ---------------- */
async function downloadMarkdownAsPdf(title, mdUrl) {
  try {
    const res = await fetch(mdUrl);
    const text = await res.text();

    const plain = text
      .replace(/^#+\s/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`([^`]*)`/g, "$1")
      .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
      .replace(/!\[(.*?)\]\((.*?)\)/g, "")
      .replace(/\n{2,}/g, "\n\n");

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;

    doc.setFont("Times", "Roman");
    doc.setFontSize(16);
    doc.text(title, margin, 60);

    doc.setFontSize(12);
    doc.setFont("Times", "Normal");
    const lines = doc.splitTextToSize(plain, maxWidth);
    doc.text(lines, margin, 100);

    const safeTitle = title.replace(/[^\w\s]/gi, "").slice(0, 50).trim();
    doc.save(`${safeTitle || "book"}.pdf`);
  } catch (err) {
    alert("Failed to generate PDF.");
    console.error(err);
  }
}

/* ---------------- Book Reader Modal ---------------- */
const BookViewerModal = ({ open, onClose, bookUrl, isPdf, title }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchBookContent = useCallback(async () => {
    if (!bookUrl) return;
    setLoading(true);
    try {
      const res = await fetch(bookUrl, { mode: "cors" });
      const text = await res.text();
      setContent(text);
    } catch {
      setContent("");
    } finally {
      setLoading(false);
    }
  }, [bookUrl]);

  useEffect(() => {
    if (open && bookUrl && !isPdf) fetchBookContent();
  }, [open, bookUrl, isPdf, fetchBookContent]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50">
      <div className="bg-white w-full h-full rounded-none shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-emerald-600 text-white px-6 py-3 flex justify-between items-center">
          <h2 className="font-semibold truncate">{title}</h2>
          <span className="text-xs bg-white/20 px-2 py-1 rounded">
            Reading Mode: {isPdf ? "PDF" : "Text"}
          </span>
          <button onClick={onClose} className="text-white text-lg font-bold ml-4">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {bookUrl ? (
            isPdf ? (
              <AdvancedPDFViewer pdfUrl={bookUrl} />
            ) : loading ? (
              <p className="p-4">Loading…</p>
            ) : (
              <MarkdownRenderer content={content} />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-600">
              <p className="text-lg font-medium">Reading preview is not available for this title.</p>
              <p className="text-sm text-slate-500 mt-2">
                Please refer to the book’s details for description and metadata.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-100 flex justify-between items-center">
          <div className="flex gap-2">
            {isPdf && bookUrl && (
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(bookUrl);
                    const blob = await response.blob();
                    const blobUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = blobUrl;
                    a.download = `${title.replace(/[^\w\s]/gi, "").slice(0, 50).trim() || "book"}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(blobUrl);
                  } catch (err) {
                    console.error("Download failed:", err);
                    alert("Unable to download PDF.");
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Download PDF
              </button>
            )}

            {!isPdf && bookUrl && (
              <button
                onClick={() => downloadMarkdownAsPdf(title, bookUrl)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Download as PDF
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded"
          >
            Close Reader
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Book Detail Modal (Gradient Card UI) ---------------- */
export default function BookDetailModal({ open, handleClose, book }) {
  const [readerModalOpen, setReaderModalOpen] = useState(false);
  const [isPdf, setIsPdf] = useState(false);

  useEffect(() => {
    if (book?.volumeInfo?.bookUrl) {
      setIsPdf(book.volumeInfo.bookUrl.toLowerCase().includes("pdf"));
    }
  }, [book]);

  if (!book || !open) return null;
  const info = book.volumeInfo;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-y-auto max-h-[95vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
            <h2 className="text-xl font-bold">{info.title}</h2>
            <button onClick={handleClose} className="text-white">
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col sm:flex-row gap-6">
            {info.imageLinks?.thumbnail && (
              <img
                src={info.imageLinks.thumbnail}
                alt={info.title}
                className="w-40 h-56 object-cover rounded shadow"
              />
            )}

            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-500">AUTHOR</p>
                <p className="font-medium">{info.authors?.join(", ") || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-500">PUBLISHED</p>
                <p className="font-medium">{info.publishedDate || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-500">LANGUAGE</p>
                <p className="font-medium">{info.language?.toUpperCase() || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-500">GENRE</p>
                <p className="font-medium">{info.categories?.join(", ") || "—"}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
              <p className="font-semibold mb-2">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {info.description || "No description available."}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="px-6 pb-6 flex gap-3">
            {info.bookUrl ? (
              <button
                onClick={() => setReaderModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded"
              >
                {isPdf ? "Read PDF" : "Read Book"}
              </button>
            ) : (
              <span className="text-gray-500 italic">
                No digital content attached for this book.
              </span>
            )}
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Reader Modal */}
      <BookViewerModal
        open={readerModalOpen}
        onClose={() => setReaderModalOpen(false)}
        bookUrl={info.bookUrl}
        isPdf={isPdf}
        title={info.title}
      />
    </>
  );
}
