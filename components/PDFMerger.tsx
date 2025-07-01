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
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    setIsUploading(true);
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
    
    // Simulate upload animation
    setTimeout(() => {
      setFiles(prev => [...prev, ...newFiles]);
      setIsUploading(false);
    }, 800);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
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

    // Enhanced progress animation with multiple stages
    const progressStages = [
      { progress: 15, delay: 300, message: 'Analyzing files...' },
      { progress: 35, delay: 500, message: 'Processing PDFs...' },
      { progress: 60, delay: 700, message: 'Merging documents...' },
      { progress: 85, delay: 400, message: 'Finalizing...' },
      { progress: 95, delay: 200, message: 'Almost done...' }
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