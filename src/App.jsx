import React, { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";
import Footer from "./components/Footer";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const OUTPUT_SCALE = 2;

const App = () => {
  const [pixelSize, setPixelSize] = useState(0);
  const [imageSrc, setImageSrc] = useState(null);
  const [imageObj, setImageObj] = useState(null);
  const [error, setError] = useState("");
  const canvasRef = useRef(null);

  useEffect(() => {
    if (imageObj) {
      drawPixelArt();
    }
  }, [imageObj, pixelSize]);

  useEffect(() => {
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg"];
    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Please upload a PNG or JPG image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 10MB. Please upload a smaller image.");
      return;
    }

    setError("");

    if (imageSrc) {
      URL.revokeObjectURL(imageSrc);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => setImageObj(img);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);

    setImageSrc(URL.createObjectURL(file));
  };

  const drawPixelArt = useCallback(() => {
    if (!imageObj) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const scaleFactor = Math.min(window.innerWidth * 0.9 / imageObj.width, 500 / imageObj.height, 1);
    const newWidth = Math.floor(imageObj.width * scaleFactor);
    const newHeight = Math.floor(imageObj.height * scaleFactor);

    canvas.width = newWidth * OUTPUT_SCALE;
    canvas.height = newHeight * OUTPUT_SCALE;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(OUTPUT_SCALE, OUTPUT_SCALE);

    if (pixelSize === 0) {
      ctx.drawImage(imageObj, 0, 0, newWidth, newHeight);
      return;
    }

    const offscreenCanvas = document.createElement("canvas");
    const offCtx = offscreenCanvas.getContext("2d");
    offscreenCanvas.width = newWidth;
    offscreenCanvas.height = newHeight;
    offCtx.drawImage(imageObj, 0, 0, newWidth, newHeight);

    const imageData = offCtx.getImageData(0, 0, newWidth, newHeight);
    const data = imageData.data;

    for (let y = 0; y < newHeight; y += pixelSize) {
      for (let x = 0; x < newWidth; x += pixelSize) {
        const index = (y * newWidth + x) * 4;
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const alpha = data[index + 3] / 255;

        ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
        ctx.fillRect(x, y, pixelSize, pixelSize);
      }
    }
  }, [imageObj, pixelSize]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "pixel_art.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-black text-white">
        <main className="flex-grow flex flex-col items-center p-5">
          <h1 className="text-3xl text-center text-wrap pb-5">PixelX<br /><span className="text-2xl">Convert Image to Pixels</span></h1>
          <label
            className="border-2 border-dashed p-5 rounded-lg text-center flex items-center justify-center flex-col gap-3.5 hover:bg-white hover:text-black hover:border-solid cursor-pointer duration-300 transition group"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files.length) {
                handleImageUpload({ target: { files: e.dataTransfer.files } });
              }
            }}
          >
            <svg className="upload-icon w-10 h-10 transition duration-300 fill-white group-hover:fill-black" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
              <path d="M245-170q-31 0-53-22t-22-53v-80q0-15.5 11-26.5t26.5-11q15.5 0 26.5 11t11 26.5v80h470v-80q0-15.5 11-26.5t26.5-11q15.5 0 26.5 11t11 26.5v80q0 31-22 53t-53 22H245Zm197.5-477.5L367-572q-11 11-26.25 10.75T314.5-572.5q-10.5-11-10.75-26t10.75-26l139-139q5.5-5.5 12.25-8.25T480-774.5q7.5 0 14.25 2.75t12.25 8.25l139 139q11 11 10.75 26t-10.75 26q-11 11-26.25 11.25T593-572l-75.5-75.5v285q0 15.5-11 26.5T480-325q-15.5 0-26.5-11t-11-26.5v-285Z" />
            </svg>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <p className="text-lg font-semibold">Click or Drag & Drop to Upload</p>
            <p className="text-sm text-red-500">Supports: PNG, JPG</p>
          </label>
          {error && <p className="text-red-500 mt-2 text-center text-wrap">{error}</p>}
          {imageObj && (
            <>
              <div className="pixel-container flex items-center justify-center flex-col">
                <label className="mt-5 text-lg mr-2">Pixel Size:</label>
                <input type="number" value={pixelSize} min="0" max="100" onChange={(e) => { const value = parseInt(e.target.value) || 0; setPixelSize(Math.min(Math.max(value, 0), 100)); }} className="mt-5 p-2 border-2 border-dashed rounded-lg outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center" />
              </div>
              <div className="w-full max-w-lg overflow-hidden flex justify-center items-center">
                <canvas ref={canvasRef} className="mt-5 border-2 border-dashed rounded-lg max-w-full"></canvas>
              </div>
              <button onClick={downloadImage} className="flex gap-2 items-center justify-center mt-5 cursor-pointer border-2 p-3 border-dashed hover:bg-white hover:text-black hover:border-solid rounded-lg duration-300 transition group">
                <svg className="download-icon w-10 h-10 transition duration-300 fill-white group-hover:fill-black" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
                  <path d="M480-340.5q-7.5 0-14.25-2.75t-12.25-8.25l-139-139q-11-11-10.75-26t10.75-26q11-11 26.25-11.25T367-543l75.5 75.5v-285q0-15.5 11-26.5t26.5-11q15.5 0 26.5 11t11 26.5v285L593-543q11-11 26.25-10.75t26.25 11.25q10.5 11 10.75 26t-10.75 26l-139 139q-5.5 5.5-12.25 8.25T480-340.5ZM245-170q-31 0-53-22t-22-53v-80q0-15.5 11-26.5t26.5-11q15.5 0 26.5 11t11 26.5v80h470v-80q0-15.5 11-26.5t26.5-11q15.5 0 26.5 11t11 26.5v80q0 31-22 53t-53 22H245Z" />
                </svg>
                Download Image
              </button>
            </>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default App;
