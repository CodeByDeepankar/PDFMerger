import React, { useState, useRef, useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import styles from '../styles/PDFMerger.module.css';

interface UploadedFile {
  file: File;
  id: string;
}

const PDFMerger = () => {
  // State management
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
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    setIsUploading(true);
    setErrorMessage(null);
    const newFiles: UploadedFile[] = [];
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        if (file.type !== 'application/pdf') {
          throw new Error('Only PDF files are allowed');
        }
        if (file.size > 50 * 1024 * 1024) {
          throw new Error('File size exceeds 50MB limit');
        }
        newFiles.push({
          file,
          id: `${Date.now()}-${i}`
        });
      }
      
      setTimeout(() => {
        setFiles(prev => [...prev, ...newFiles]);
        setIsUploading(false);
      }, 800);
    } catch (error) {
      setIsUploading(false);
      setErrorMessage(error instanceof Error ? error.message : 'Invalid file selected');
    }
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  // File management
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    const newFiles = [...files];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    setFiles(newFiles);
  };

  // Fetch user data
  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user-data');
      if (response.ok) {
        const data = await response.json();
        setUserGenerations(data.totalGenerations || 0);
        setDailyGenerations(data.dailyGenerations || 0);
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        setResetTime(tomorrow.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // PDF merging function
  const mergePDFs = async () => {
    if (files.length < 2) {
      setErrorMessage('Please select at least 2 PDF files to merge.');
      return;
    }

    if (dailyGenerations >= maxFreeDailyMerges) {
      setShowUpgradeModal(true);
      return;
    }

    setIsMerging(true);
    setMergeProgress(0);
    setDownloadUrl(null);
    setErrorMessage(null);

    const progressStages = [
      { progress: 15, message: 'Analyzing files...' },
      { progress: 35, message: 'Processing PDFs...' },
      { progress: 60, message: 'Merging documents...' },
      { progress: 85, message: 'Finalizing...' },
      { progress: 95, message: 'Almost done...' }
    ];

    let currentStage = 0;
    const progressInterval = setInterval(() => {
      if (currentStage < progressStages.length) {
        setMergeProgress(progressStages[currentStage].progress);
        currentStage++;
      }
    }, 600);

    try {
      const formData = new FormData();
      const totalSize = files.reduce((sum, fileObj) => sum + fileObj.file.size, 0);
      
      if (totalSize > 50 * 1024 * 1024) {
        throw new Error('Total file size exceeds 50MB limit');
      }

      files.forEach((fileObj) => {
        formData.append('files', fileObj.file);
      });

      const response = await fetch('/api/merge-pdfs', {
        method: 'POST',
        body: formData,
      });

      setMergeProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.dailyLimitReached) {
          setShowUpgradeModal(true);
          return;
        }
        throw new Error(errorData.message || 'Server error during merge');
      }

      const blob = await response.blob();
      
      if (blob.type !== 'application/pdf') {
        throw new Error('Invalid PDF file received from server');
      }

      const url = window.URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const fileName = `merged-${timestamp}.pdf`;
      
      setMergedFileName(fileName);
      setDownloadUrl(url);
      await fetchUserData();

    } catch (error) {
      console.error('Merge error:', error);
      setErrorMessage(
        error instanceof Error ? 
        error.message : 
        'Failed to merge PDFs. Please try again.'
      );
    } finally {
      clearInterval(progressInterval);
      setIsMerging(false);
    }
  };

  // Download handler
  const downloadMergedPDF = () => {
    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = mergedFileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);
    }
  };

  // Reset handler
  const clearMergedFile = () => {
    if (downloadUrl) {
      window.URL.revokeObjectURL(downloadUrl);
    }
    setDownloadUrl(null);
    setMergedFileName('merged.pdf');
    setMergeProgress(0);
    setFiles([]);
    setErrorMessage(null);
  };

 return (
  <div className={styles.container}>
    {/* Public landing page for signed out users */}
    <SignedOut>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Merge PDFs with
              <span className={styles.gradient}> Professional Ease</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Combine multiple PDF files into one document with our advanced, secure, and lightning-fast merger tool.
            </p>
            <div className={styles.heroFeatures}>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>⚡</div>
                <span>Lightning Fast</span>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>🔒</div>
                <span>100% Secure</span>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>🎯</div>
                <span>Professional Quality</span>
              </div>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.floatingCard}>
              <div className={styles.cardIcon}>📄</div>
              <div className={styles.cardText}>PDF Merger Pro</div>
            </div>
          </div>
        </div>
        <div className={styles.heroActions}>
          <SignInButton mode="modal">
            <button className={styles.ctaButton}>
              <span>Get Started Free</span>
              <div className={styles.buttonShine}></div>
            </button>
          </SignInButton>
          <p className={styles.ctaSubtext}>No credit card required • 5 free merges daily</p>
        </div>
      </div>
    </SignedOut>

    {/* Application dashboard for signed in users */}
    <SignedIn>
      <div className={styles.dashboard}>
        {/* Dashboard Header */}
        <div className={styles.dashboardHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.dashboardTitle}>PDF Merger Dashboard</h1>
            <p className={styles.dashboardSubtitle}>
              Merge, organize, and download your PDF files with ease
            </p>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className={styles.statsCard}>
          <div className={styles.statsHeader}>
            <h3>Usage Statistics</h3>
            <div className={styles.statsIcon}>📊</div>
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{dailyGenerations}</div>
              <div className={styles.statLabel}>Today's Merges</div>
              <div className={styles.statProgress}>
                <div 
                  className={styles.statProgressFill}
                  style={{ 
                    width: `${(dailyGenerations / maxFreeDailyMerges) * 100}%` 
                  }}
                ></div>
              </div>
              <div className={styles.statLimit}>
                of {maxFreeDailyMerges} free daily
              </div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{userGenerations}</div>
              <div className={styles.statLabel}>Total Merges</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{resetTime}</div>
              <div className={styles.statLabel}>Resets At</div>
            </div>
          </div>
          {dailyGenerations >= maxFreeDailyMerges && (
            <div className={styles.limitWarning}>
              <div className={styles.warningIcon}>⚠️</div>
              <div>
                <div className={styles.warningTitle}>Daily Limit Reached</div>
                <div className={styles.warningText}>
                  Upgrade to Pro for unlimited merges
                </div>
              </div>
              <button 
                className={styles.upgradeBtn}
                onClick={() => setShowUpgradeModal(true)}
              >
                Upgrade Now
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {errorMessage && (
          <div className={styles.errorCard}>
            <div className={styles.errorIcon}>❌</div>
            <div className={styles.errorText}>{errorMessage}</div>
            <button
              className={styles.errorDismiss}
              onClick={() => setErrorMessage(null)}
            >
              &times;
            </button>
          </div>
        )}

        {/* File Upload Area */}
        <div className={`${styles.uploadSection} ${dragActive ? styles.dragActive : ''}`}>
          <div 
            className={styles.uploadArea}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={styles.uploadContent}>
              {isUploading ? (
                <div className={styles.uploadingState}>
                  <div className={styles.spinner}></div>
                  <h3>Processing Files...</h3>
                  <p>Please wait while we analyze your PDFs</p>
                </div>
              ) : (
                <div className={styles.uploadPrompt}>
                  <div className={styles.uploadIcon}>📁</div>
                  <h3>Drop PDF files here or click to browse</h3>
                  <p>Support for multiple files • Maximum 50MB per file</p>
                  <div className={styles.uploadButton}>
                    <span>Choose Files</span>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf"
              onChange={(e) => handleFileSelect(e.target.files)}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className={styles.fileListCard}>
            <div className={styles.fileListHeader}>
              <h3>Selected Files ({files.length})</h3>
              <button 
                className={styles.clearAllBtn}
                onClick={() => setFiles([])}
              >
                Clear All
              </button>
            </div>
            <div className={styles.fileList}>
              {files.map((fileObj, index) => (
                <div key={fileObj.id} className={styles.fileItem}>
                  <div className={styles.fileIcon}>📄</div>
                  <div className={styles.fileInfo}>
                    <div className={styles.fileName}>{fileObj.file.name}</div>
                    <div className={styles.fileSize}>
                      {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <div className={styles.fileActions}>
                    {index > 0 && (
                      <button 
                        className={styles.moveBtn}
                        onClick={() => moveFile(index, index - 1)}
                        title="Move up"
                      >
                        ↑
                      </button>
                    )}
                    {index < files.length - 1 && (
                      <button 
                        className={styles.moveBtn}
                        onClick={() => moveFile(index, index + 1)}
                        title="Move down"
                      >
                        ↓
                      </button>
                    )}
                    <button 
                      className={styles.removeBtn}
                      onClick={() => removeFile(fileObj.id)}
                      title="Remove file"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Merge Section */}
        {files.length >= 2 && (
          <div className={styles.mergeCard}>
            {/* Progress Indicator */}
            {isMerging && (
              <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                  <h3>Merging Your PDFs</h3>
                  <div className={styles.progressPercent}>
                    {Math.round(mergeProgress)}%
                  </div>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${mergeProgress}%` }}
                  ></div>
                </div>
                <div className={styles.progressMessage}>
                  {mergeProgress < 100 ? 
                    'Processing your documents...' : 
                    'Finalizing merge...'
                  }
                </div>
              </div>
            )}

            {/* Download Section */}
            {downloadUrl && (
              <div className={styles.downloadCard}>
                <div className={styles.successHeader}>
                  <div className={styles.successIcon}>✓</div>
                  <div>
                    <h3>Merge Completed!</h3>
                    <p>Your PDF is ready for download</p>
                  </div>
                </div>
                <div className={styles.downloadActions}>
                  <button 
                    className={styles.downloadBtn}
                    onClick={downloadMergedPDF}
                  >
                    📥 Download {mergedFileName}
                  </button>
                  <button 
                    className={styles.newMergeBtn}
                    onClick={clearMergedFile}
                  >
                    🔄 Start New Merge
                  </button>
                </div>
              </div>
            )}

            {/* Merge Button */}
            {!downloadUrl && !isMerging && (
              <div className={styles.mergeActions}>
                <button 
                  className={styles.mergeBtn}
                  onClick={mergePDFs}
                  disabled={dailyGenerations >= maxFreeDailyMerges}
                >
                  {dailyGenerations >= maxFreeDailyMerges ? 
                    'Daily Limit Reached' : 
                    '🔗 Merge PDFs'
                  }
                </button>
                <p className={styles.mergeInfo}>
                  Merging {files.length} files into one document
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </SignedIn>

    {/* Upgrade Modal */}
    <showUpgradeModal
      isOpen={showUpgradeModal}
      onClose={() => setShowUpgradeModal(false)}
      generations={userGenerations}
      dailyGenerations={dailyGenerations}
      maxFreeDailyMerges={maxFreeDailyMerges}
    />
  </div>
);
export default PDFMerger;
