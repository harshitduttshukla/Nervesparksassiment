import { useState, useRef } from "react";

function UploadFile() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage("");
      // Prevent the click event from bubbling up to the parent div
      e.stopPropagation();
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setMessage("");
    }
  };

  const removeFile = () => {
    setFile(null);
    setMessage("");
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setProgress(0);
      setMessage("");

      // Actual API call
      const response = await fetch('https://nervesparks12.onrender.com/ingest', {
        method: 'POST',
        body: formData,
        // Note: Don't set Content-Type header when using FormData, browser will set it automatically with boundary
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Simulate progress since fetch doesn't provide upload progress easily
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 100);

      const result = await response.json();
      
      clearInterval(progressInterval);
      setProgress(100);
      setMessage("File uploaded successfully!");
      console.log('Upload successful:', result);
      
      // Reset form after showing success message
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 2000);

    } catch (error) {
      setMessage("Error uploading file. Please try again.");
      console.error('Upload error:', error);
      setUploading(false);
      setProgress(0);
    }
  };

  // Alternative version using axios (uncomment if you prefer axios)
  /*
  const handleUploadWithAxios = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setProgress(0);
      setMessage("");

      const response = await axios.post(
        'https://nervesparksss.onrender.com/ingest',
        formData,
        {
          headers: { 
            'Content-Type': 'multipart/form-data' 
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          },
        }
      );
      
      setMessage("File uploaded successfully!");
      console.log('Upload successful:', response.data);
      
      // Reset form after showing success message
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 2000);

    } catch (error) {
      setMessage("Error uploading file. Please try again.");
      console.error('Upload error:', error);
      setUploading(false);
      setProgress(0);
    }
  };
  */

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMessageIcon = () => {
    if (message.includes("successfully")) return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
    if (message.includes("Error")) return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const getMessageColor = () => {
    if (message.includes("successfully")) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (message.includes("Error")) return "text-red-600 bg-red-50 border-red-200";
    return "text-amber-600 bg-amber-50 border-amber-200";
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Compact Header */}
        <div className="bg-blue-600 p-4 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-xl mb-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Document Upload</h2>
          <p className="text-blue-100 text-sm">PDF, Images, Scanned Documents</p>
        </div>

        <div className="p-4">
          {/* Compact Drag & Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${!file ? 'cursor-pointer' : ''} ${
              dragActive
                ? "border-blue-400 bg-blue-50"
                : file
                ? "border-green-300 bg-green-50"
                : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !uploading && !file && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            
            {!file ? (
              <div className="space-y-3" onClick={() => !uploading && fileInputRef.current?.click()}>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l4 4-4 4" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 mb-1">
                    Drop files here or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports PDF, JPG, PNG, xlsx, xls, csv, txt, docx
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 mb-1 truncate text-sm">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                {!uploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-colors duration-200"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Compact Progress Bar */}
          {uploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Processing document...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Compact Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className={`w-full mt-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
              uploading || !file
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
            }`}
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Processing {Math.round(progress)}%
              </div>
            ) : (
              "Process Document"
            )}
          </button>

          {/* Compact Status Message */}
          {message && (
            <div className={`mt-3 p-3 rounded-xl border flex items-center gap-2 text-sm ${getMessageColor()}`}>
              {getMessageIcon()}
              <span className="font-medium">{message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadFile;