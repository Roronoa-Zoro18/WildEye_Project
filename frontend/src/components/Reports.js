import React, { useState, useEffect } from 'react';
import './Reports.css';

const Reports = () => {
  const [reportData, setReportData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch real data from the backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch sightings data from backend
        const response = await fetch('http://localhost:5000/api/sightings');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const sightings = await response.json();
        
        // Process analytics data
        const processedAnalytics = processAnalyticsData(sightings);
        setAnalyticsData(processedAnalytics);
        
        // Process report data
        const processedReports = processReportData(sightings);
        setReportData(processedReports);
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Process analytics data from sightings
  const processAnalyticsData = (sightings) => {
    const totalDetections = sightings.length;
    const endangeredSpecies = sightings.filter(sighting => sighting.status === 'Endangered').length;
    const vulnerableSpecies = sightings.filter(sighting => sighting.status === 'Vulnerable').length;
    const last24Hours = sightings.filter(sighting => {
      const now = new Date();
      const sightingTime = new Date(sighting.timestamp);
      return (now - sightingTime) / (1000 * 60 * 60) <= 24;
    }).length;

    return [
      { label: 'Total Detections', value: totalDetections.toLocaleString(), change: '+12%' },
      { label: 'Threatened Species', value: (endangeredSpecies + vulnerableSpecies).toLocaleString(), change: '+5%' },
      { label: 'Last 24 Hours', value: last24Hours.toLocaleString(), change: '+18%' }
    ];
  };
  
  // Process report data
  const processReportData = (sightings) => {
    // Group sightings by date
    const sightingsByDate = {};
    sightings.forEach(sighting => {
      const date = new Date(sighting.timestamp).toISOString().split('T')[0];
      if (!sightingsByDate[date]) {
        sightingsByDate[date] = [];
      }
      sightingsByDate[date].push(sighting);
    });

    // Group sightings by week (Sunday to Saturday)
    const sightingsByWeek = {};
    sightings.forEach(sighting => {
      const sightingDate = new Date(sighting.timestamp);
      // Get the Sunday of the week for this sighting
      const sunday = new Date(sightingDate);
      sunday.setDate(sightingDate.getDate() - sightingDate.getDay());
      const weekKey = sunday.toISOString().split('T')[0];
      
      if (!sightingsByWeek[weekKey]) {
        sightingsByWeek[weekKey] = [];
      }
      sightingsByWeek[weekKey].push(sighting);
    });

    // Group sightings by month
    const sightingsByMonth = {};
    sightings.forEach(sighting => {
      const monthKey = new Date(sighting.timestamp).toISOString().slice(0, 7); // YYYY-MM
      if (!sightingsByMonth[monthKey]) {
        sightingsByMonth[monthKey] = [];
      }
      sightingsByMonth[monthKey].push(sighting);
    });

    // Create sample reports
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate the Sunday of this week
    const todayDate = new Date();
    const sunday = new Date(todayDate);
    sunday.setDate(todayDate.getDate() - todayDate.getDay());
    const thisWeek = sunday.toISOString().split('T')[0];
    
    // Get current month in YYYY-MM format
    const thisMonth = new Date().toISOString().slice(0, 7);
    
    const reports = [
      { 
        id: 1, 
        title: 'Daily Animal Detection Report', 
        date: today, 
        status: 'Generated',
        data: sightingsByDate[today] || []
      },
      { 
        id: 2, 
        title: 'Weekly Conservation Summary', 
        date: thisWeek,
        status: 'Generated',
        data: sightingsByWeek[thisWeek] || []
      },
      { 
        id: 3, 
        title: 'Monthly Camera Performance', 
        date: thisMonth,
        status: 'Generated',
        data: sightingsByMonth[thisMonth] || []
      }
    ];

    return reports;
  };

  // Handle report generation
  const handleGenerateReport = () => {
    alert('Report generation started. This may take a few moments.');
    // In a real implementation, this would trigger a backend process
  };

  // Handle view report
  const handleViewReport = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  // Handle download report
  const handleDownloadReport = (report) => {
    // Create a simple text report
    let reportContent = `WildEye Wildlife Monitoring Report\n`;
    reportContent += `=====================================\n\n`;
    reportContent += `Report Title: ${report.title}\n`;
    reportContent += `Date: ${report.date}\n`;
    reportContent += `Status: ${report.status}\n\n`;
    
    if (report.data && report.data.length > 0) {
      reportContent += `Detected Animals:\n`;
      reportContent += `----------------\n`;
      report.data.forEach((sighting, index) => {
        reportContent += `${index + 1}. ${sighting.animal} (${sighting.status}) - ${new Date(sighting.timestamp).toLocaleString()}\n`;
      });
    } else {
      reportContent += `No animal detections recorded for this report.\n`;
    }
    
    // Create a Blob and download it
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '_')}_${report.date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  if (loading) {
    return (
      <div className="reports-container">
        <div className="reports-header">
          <h1>Analytics & Reports</h1>
          <p>Loading wildlife monitoring data...</p>
        </div>
        <div className="loading-indicator">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-container">
        <div className="reports-header">
          <h1>Analytics & Reports</h1>
          <p>Error loading data: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>Analytics & Reports</h1>
        <p>Detailed insights and downloadable reports on wildlife activity</p>
      </div>

      <div className="reports-content">
        {/* Analytics Cards */}
        <section className="analytics-section">
          <h2>System Analytics</h2>
          <div className="analytics-grid">
            {analyticsData.map((item, index) => (
              <div key={index} className="analytic-card">
                <h3>{item.label}</h3>
                <div className="analytic-value">
                  <span className="value">{item.value}</span>
                  <span className="change">{item.change}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reports List */}
        <section className="reports-section">
          <div className="section-header">
            <h2>Generated Reports</h2>
            <button className="generate-btn" onClick={handleGenerateReport}>Generate New Report</button>
          </div>
          
          <div className="reports-table">
            <div className="table-header">
              <div className="table-cell">Report Title</div>
              <div className="table-cell">Date</div>
              <div className="table-cell">Status</div>
              <div className="table-cell">Actions</div>
            </div>
            
            {reportData.map((report) => (
              <div key={report.id} className="table-row">
                <div className="table-cell">{report.title}</div>
                <div className="table-cell">{report.date}</div>
                <div className="table-cell">
                  <span className={`status-badge ${report.status.toLowerCase()}`}>
                    {report.status}
                  </span>
                </div>
                <div className="table-cell">
                  <button className="action-btn view" onClick={() => handleViewReport(report)}>View</button>
                  <button className="action-btn download" onClick={() => handleDownloadReport(report)}>Download</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Charts Section */}
        <section className="charts-section">
          <h2>Activity Trends</h2>
          <div className="charts-container">
            <div className="chart-placeholder">
              <div className="chart-illustration">
                <div className="chart-bar bar-1"></div>
                <div className="chart-bar bar-2"></div>
                <div className="chart-bar bar-3"></div>
                <div className="chart-bar bar-4"></div>
                <div className="chart-bar bar-5"></div>
              </div>
              <p>Animal Detections Over Time</p>
            </div>
            
            <div className="chart-placeholder">
              <div className="chart-illustration pie-chart">
                <div className="pie-slice slice-1"></div>
                <div className="pie-slice slice-2"></div>
                <div className="pie-slice slice-3"></div>
              </div>
              <p>Species Distribution</p>
            </div>
          </div>
        </section>
      </div>

      {/* Report Detail Modal */}
      {isModalOpen && selectedReport && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedReport.title}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="report-details">
                <p><strong>Date:</strong> {selectedReport.date}</p>
                <p><strong>Status:</strong> <span className={`status-badge ${selectedReport.status.toLowerCase()}`}>{selectedReport.status}</span></p>
                
                <h3>Animal Detections</h3>
                {selectedReport.data && selectedReport.data.length > 0 ? (
                  <div className="detections-list">
                    {selectedReport.data.map((sighting, index) => (
                      <div key={index} className="detection-item">
                        <div className="detection-animal">
                          <h4>{sighting.animal}</h4>
                          <span className={`status-badge ${sighting.status.toLowerCase()}`}>
                            {sighting.status}
                          </span>
                        </div>
                        <p className="detection-time">
                          {new Date(sighting.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No animal detections recorded for this report.</p>
                )}
              </div>
              
              <div className="modal-actions">
                <button className="action-btn download" onClick={() => handleDownloadReport(selectedReport)}>
                  Download Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;