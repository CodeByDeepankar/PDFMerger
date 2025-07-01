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
  const [mergeProgress, setMergeProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [mergedFileName, setMergedFileName] = useState<string>('merged.pdf');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
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

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user-data');
      if (response.ok) {
        const data = await response.json();
        setUserGenerations(data.totalGenerations || 0);
        setDailyGenerations(data.dailyGenerations || 0);
        
        // Calculate reset time (midnight)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        setResetTime(tomorrow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const mergePDFs = async () => {
    if (files.length < 2) {
      alert('Please select at least 2 PDF files to merge.');
      return;
    }

    // Check daily limit for free users
    if (dailyGenerations >= maxFreeDailyMerges) {
      setShowUpgradeModal(true);
      return;
    }

    setIsMerging(true);
    setMergeProgress(0);
    setDownloadUrl(null);

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setMergeProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      const formData = new FormData();
      files.forEach((fileObj, index) => {
        formData.append('files', fileObj.file);
      });

      const response = await fetch('/api/merge-pdfs', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setMergeProgress(100);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const fileName = `merged-${timestamp}.pdf`;
        setMergedFileName(fileName);
        setDownloadUrl(url);
        
        // Update user data after successful merge
        await fetchUserData();
      } else {
        clearInterval(progressInterval);
        setMergeProgress(0);
        const errorData = await response.json();
        if (errorData.dailyLimitReached) {
          setShowUpgradeModal(true);
        } else {
          alert(errorData.error || 'Failed to merge PDFs');
        }
      }
    } catch (error) {
      clearInterval(progressInterval);
      setMergeProgress(0);
      console.error('Error merging PDFs:', error);
      alert('An error occurred while merging PDFs');
    } finally {
      setIsMerging(false);
    }
  };

  const downloadMergedPDF = () => {
    if (downloadUrl) {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = mergedFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const clearMergedFile = () => {
    if (downloadUrl) {
      window.URL.revokeObjectURL(downloadUrl);
    }
    setDownloadUrl(null);
    setMergedFileName('merged.pdf');
    setMergeProgress(0);
    setFiles([]);
  };

  return (
    <div className={styles.container}>
      <SignedOut>
        <div className={styles.signInPrompt}>
          <h2>Sign in to merge PDFs</h2>
          <p>Please sign in to access the PDF merger tool.</p>
          <SignInButton mode="modal">
            <button className={styles.signInButton}>Sign In</button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div className={styles.header}>
          <h1>PDF Merger</h1>
          <p>Merge multiple PDF files into one document</p>
        </div>

        {/* Usage Stats */}
        <div className={styles.usageStats}>
          <div className={styles.usageInfo}>
            <h3>Daily merges: {dailyGenerations}/{maxFreeDailyMerges}</h3>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${(dailyGenerations / maxFreeDailyMerges) * 100}%` }}
              ></div>
            </div>
            {dailyGenerations >= maxFreeDailyMerges ? (
              <p className={styles.limitReached}>Daily limit reached! Resets at midnight.</p>
            ) : (
              <p className={styles.resetInfo}>Resets at midnight ({resetTime})</p>
            )}
            <p className={styles.totalInfo}>Total merges: {userGenerations}</p>
          </div>
        </div>

        <div 
          className={styles.uploadArea}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className={styles.uploadContent}>
            <i className="ri-upload-cloud-2-line"></i>
            <h3>Drag & Drop PDF Files</h3>
            <p>or click to select files</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf"
              onChange={(e) => handleFileSelect(e.target.files)}
              style={{ display: 'none' }}
            />
            <button 
              className={styles.selectButton}
              onClick={() => fileInputRef.current?.click()}
            >
              Select PDF Files
            </button>
          </div>
        </div>

        {files.length > 0 && (
          <div className={styles.fileList}>
            <h3>Selected Files ({files.length})</h3>
            {files.map((fileObj, index) => (
              <div key={fileObj.id} className={styles.fileItem}>
                <div className={styles.fileInfo}>
                  <i className="ri-file-pdf-line"></i>
                  <span>{fileObj.file.name}</span>
                  <span className={styles.fileSize}>
                    ({(fileObj.file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <div className={styles.fileActions}>
                  {index > 0 && (
                    <button 
                      onClick={() => moveFile(index, index - 1)}
                      className={styles.moveButton}
                    >
                      ↑
                    </button>
                  )}
                  {index < files.length - 1 && (
                    <button 
                      onClick={() => moveFile(index, index + 1)}
                      className={styles.moveButton}
                    >
                      ↓
                    </button>
                  )}
                  <button 
                    onClick={() => removeFile(fileObj.id)}
                    className={styles.removeButton}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {files.length >= 2 && (
          <div className={styles.mergeSection}>
            {/* Progress Bar */}
            {isMerging && (
              <div className={styles.progressContainer}>
                <div className={styles.progressLabel}>Merging PDFs... {Math.round(mergeProgress)}%</div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${mergeProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Download Section */}
            {downloadUrl && (
              <div className={styles.downloadSection}>
                <div className={styles.successMessage}>
                  <i className="ri-check-circle-line"></i>
                  <span>PDF merged successfully!</span>
                </div>
                <div className={styles.downloadActions}>
                  <button 
                    className={styles.downloadButton}
                    onClick={downloadMergedPDF}
                  >
                    <i className="ri-download-line"></i>
                    Download {mergedFileName}
                  </button>
                  <button 
                    className={styles.clearButton}
                    onClick={clearMergedFile}
                  >
                    <i className="ri-refresh-line"></i>
                    Merge New Files
                  </button>
                </div>
              </div>
            )}

            {/* Merge Button */}
            {!downloadUrl && (
              <button 
                className={styles.mergeButton}
                onClick={mergePDFs}
                disabled={isMerging || dailyGenerations >= maxFreeDailyMerges}
              >
                {isMerging ? 'Merging...' : 'Merge PDFs'}
              </button>
            )}
            {dailyGenerations >= maxFreeDailyMerges && (
              <p className={styles.upgradePrompt}>
                Daily limit reached. <button onClick={() => setShowUpgradeModal(true)}>Upgrade to Pro</button> for unlimited merges.
              </p>
            )}
          </div>
        )}
      </SignedIn>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        generations={userGenerations}
        dailyGenerations={dailyGenerations}
        maxFreeDailyMerges={maxFreeDailyMerges}
      />
    </div>
  );
};

export default PDFMerger;