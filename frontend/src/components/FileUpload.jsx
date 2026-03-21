import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

const FileUpload = ({ onFileUpload }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        onFileUpload(json);
      } catch (err) {
        alert('Invalid JSON file. Please upload a valid workflow JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      <input 
        type="file" 
        accept=".json" 
        style={{ display: 'none' }} 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
      <button className="action-btn primary" onClick={() => fileInputRef.current?.click()} title="Upload Workflow JSON">
        <Upload size={16} /> Upload JSON
      </button>
    </>
  );
};

export default FileUpload;
