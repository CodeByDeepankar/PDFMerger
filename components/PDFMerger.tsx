import React, { useState, useRef, useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import UpgradeModal from './UpgradeModal';
import styles from '../styles/PDFMerger.module.css';

interface UploadedFile {
  file: File;
  id: string;
}

const PDFMerger = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userGenerations, setUserGenerations] = useState(0);
  const [dailyGenerations, setDailyGenerations] = useState(0);
  const [maxFreeDailyMerges] = useState(5);
  const [resetTime, setResetTime] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.type === 'application/pdf') {
        newFiles.push({
          file,
          id: `${Date.now()}-${i}`
        });
      }
    }
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    const newFiles = [...files];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    setFiles(newFiles);
  };

  const mergePDFs = async () => {
    if (files.length < 2) {
      alert('Please select at least 2 PDF files');
      return;
    }

    setIsMerging(true);
    try {
      const formData = new FormData();
      files.forEach(({ file }) => {
        formData.append('pdfs', file);
      });

      const response = await fetch('/api/merge-pdfs', {
        method: 'POST',
        body: formData,
      });

      if (response.status === 403) {
        // Handle daily limit exceeded
        const errorData = await response.json();
        setUserGenerations(errorData.totalGenerations || 0);
        setDailyGenerations(errorData.dailyGenerations || 0);
        setResetTime(errorData.resetTime || '');
        setShowUpgradeModal(true);
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to merge PDFs');
      }

      // Download the merged PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Reset files after successful merge
      setFiles([]);
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('Failed to merge PDFs. Please try again.');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className={styles.container}>
      <SignedOut>
        <div className={styles.signInPrompt}>
          <h2>Sign in to merge PDFs</h2>
          <p>Create an account to start merging your PDF files</p>
          <SignInButton>
            <button className={styles.signInBtn}>Sign In</button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div className={styles.mergerSection}>
          <h2>PDF Merger</h2>

          {/* Upload Area */}
          <div
            className={styles.uploadArea}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={styles.uploadIcon}>📄</div>
            <h3>Drop PDF files here or click to browse</h3>
            <p>Select multiple PDF files to merge them into one</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,application/pdf"
              onChange={(e) => handleFileSelect(e.target.files)}
              style={{ display: 'none' }}
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className={styles.fileList}>
              <h3>Selected Files ({files.length})</h3>
              {files.map((fileItem, index) => (
                <div key={fileItem.id} className={styles.fileItem}>
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{fileItem.file.name}</span>
                    <span className={styles.fileSize}>
                      {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <div className={styles.fileActions}>
                    {index > 0 && (
                      <button
                        onClick={() => moveFile(index, index - 1)}
                        className={styles.moveBtn}
                      >
                        ↑
                      </button>
                    )}
                    {index < files.length - 1 && (
                      <button
                        onClick={() => moveFile(index, index + 1)}
                        className={styles.moveBtn}
                      >
                        ↓
                      </button>
                    )}
                    <button
                      onClick={() => removeFile(fileItem.id)}
                      className={styles.removeBtn}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Merge Button */}
          {files.length >= 2 && (
            <button
              onClick={mergePDFs}
              disabled={isMerging}
              className={styles.mergeBtn}
            >
              {isMerging ? 'Merging...' : `Merge ${files.length} PDFs`}
            </button>
          )}
        </div>
      </SignedIn>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        generations={userGenerations}
        maxFreeGenerations={maxFreeGenerations}
      />
    </div>
  );
};

export default PDFMerger;