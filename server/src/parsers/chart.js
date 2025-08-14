import fs from "fs";
import path from "path";
import { createCanvas } from "canvas";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

export async function extractChartsFromPDF(pdfPath, outputDir) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const loadingTask = pdfjsLib.getDocument(pdfPath);
  const pdfDoc = await loadingTask.promise;
  const chartPaths = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    await page.render({ canvasContext: context, viewport }).promise;

    const imgPath = path.join(outputDir, `page-${pageNum}.png`);
    fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));
    chartPaths.push(imgPath);

    console.log(`Saved page ${pageNum} as image: ${imgPath}`);
  }

  return chartPaths;
}
