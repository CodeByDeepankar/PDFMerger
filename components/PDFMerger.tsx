const mergePDFs = async () => {
  if (File.length < 2) {
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
      const errorData = await response.json();
      if (errorData.dailyLimitReached) {
        setShowUpgradeModal(true);
      } else {
        throw new Error(errorData.error || 'Failed to merge PDFs');
      }
    }
  } catch (error) {
    console.error('Error merging PDFs:', error);
    alert(error instanceof Error ? error.message : 'An error occurred while merging PDFs');
  } finally {
    clearInterval(progressInterval);
    setIsMerging(false);
  }
};
