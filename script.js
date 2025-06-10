import React, { useState, useRef, useEffect } from "https://esm.sh/react@18.2.0";
import ReactDOM from "https://esm.sh/react-dom@18.2.0";
import DiffMatchPatch from "https://esm.sh/diff-match-patch";
import * as XLSX from "https://esm.sh/xlsx";

// Function to track and highlight changes
const trackChanges = (original, final) => {
  const dmp = new DiffMatchPatch();
  const diff = dmp.diff_main(original, final);
  dmp.diff_cleanupSemantic(diff);
  
  const highlighted = diff
    .map(([op, text]) => {
      if (op === -1) {
        return `<span style="color: red; text-decoration: line-through;">${text}</span>`;
      } else if (op === 1) {
        return `<span style="color: green;">${text}</span>`;
      } else {
        return text;
      }
    })
    .join("");

  return highlighted;
};

function DreamReportProcessor() {
  const [reports, setReports] = useState([]);
  const [singleReports, setSingleReports] = useState([]);
  const [selectedReportIndex, setSelectedReportIndex] = useState(0);
  const [idFieldOptions, setIdFieldOptions] = useState([]);
  const [selectedIdField, setSelectedIdField] = useState("");
  const [reportFieldOptions, setReportFieldOptions] = useState([]);
  const [selectedReportFields, setSelectedReportFields] = useState([]);
  const [editedReports, setEditedReports] = useState({});
  const [processedReports, setProcessedReports] = useState({});
  const [cleanedReports, setCleanedReports] = useState({});
  const [showFieldSelection, setShowFieldSelection] = useState(false);
  const [dreamsLoaded, setDreamsLoaded] = useState(false);
  
  // State variables for manual anonymization
  const [nameInput, setNameInput] = useState("");
  const [placeInput, setPlaceInput] = useState("");
  const [experimenterInput, setExperimenterInput] = useState("");

  // State variable for the survey completion date field
  const [surveyCompletionDateField, setSurveyCompletionDateField] = useState("");
  const [dateFieldOptions, setDateFieldOptions] = useState([]);

  // New state variable for split dream field name
  const [newReportFieldName, setNewReportFieldName] = useState('');

  const textareaRef = useRef(null);

  useEffect(() => {
    console.log("Report Field Options:", reportFieldOptions);
    console.log("Date Field Options:", dateFieldOptions);
  }, [reportFieldOptions, dateFieldOptions]);

  // Load and parse the CSV or XLSX file
  const handleLoadReports = (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (fileExtension === 'csv') {
        Papa.parse(file, {
          header: true,
          complete: (result) => processLoadedData(result.data),
        });
      } else if (fileExtension === 'xlsx') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          processLoadedData(jsonData);
        };
        reader.readAsArrayBuffer(file);
      }
    }
  };

// ... (continued from Part 1)

  const processLoadedData = (data) => {
  console.log("Raw Parsed Data:", data);

  if (data.length > 0) {
    let detectedIdFields = [];
    let detectedReportFields = [];
    let detectedDateFields = [];

    // Specific fields to include
    const specificReportFields = [
      "Home_dream_recall_remark_2",
      "Home_dream_recall_remark_3",
      "Home_dream_recall_remark",
      "Home_dream_recall_remark_4",
      "Home_dream_recall_remark_1",
      "Home_dream_recall_remark_4_1",
      "Home_dream_recall_remark_2_1",
      "Home_dream_recall_remark_3_1",
      "Home_dream_recall_remark_1_1",
      "Home_dream_recall_remark_4_1_1",
      "Dream_description_1_1_1",
      "Adap_Dream_recall_43_1_3_1_1",
      "Home_dream_recall_remark_1_1_1",
      "Home_dream_recall_remark_4_1_1_1",
      "Dream_description_1_1_1_1",
      "Adap_Dream_recall_43_1_3_1_1_1"
    ];

    // Get all unique field names from all rows
    const allFields = new Set();
    data.forEach(row => {
      Object.keys(row).forEach(field => allFields.add(field));
    });

    console.log("All detected fields:", Array.from(allFields));

    Array.from(allFields).forEach(field => {
      const normalizedField = field.trim().toLowerCase();

      if (normalizedField.includes("id")) {
        detectedIdFields.push(field);
      }

      if (specificReportFields.includes(field) || normalizedField.includes("report")) {
        detectedReportFields.push(field);
      }

      if (normalizedField.includes("date") || 
          normalizedField.includes("completed") || 
          normalizedField.includes("survey completion")) {
        detectedDateFields.push(field);
      }
    });

    console.log("Detected ID Fields:", detectedIdFields);
    console.log("Detected Report Fields:", detectedReportFields);
    console.log("Detected Date Fields:", detectedDateFields);

    // Handle Cleaned_ columns
    const cleanedReportFields = detectedReportFields.map(field => `Cleaned_${field}`);
    const initialCleanedReports = {};

    data.forEach(row => {
      detectedReportFields.forEach(field => {
        if (row[field] && row[`Cleaned_${field}`]) {
          const reportKey = `${row[detectedIdFields[0]]}_${field}_${row[detectedDateFields[0]]}`;
          initialCleanedReports[reportKey] = row[`Cleaned_${field}`];
        }
      });
    });

    setIdFieldOptions(detectedIdFields);
    setReportFieldOptions(detectedReportFields);
    setDateFieldOptions(detectedDateFields);

    // Preselect "Castor Participant ID" if present
    const castorIdField = detectedIdFields.find(field => field === "Castor Participant ID");
    setSelectedIdField(castorIdField || detectedIdFields[0] || "");

    // Preselect "Survey Completed On" if present (case-insensitive)
    const surveyCompletedOnField = detectedDateFields.find(field => 
      field.toLowerCase() === "survey completed on" || 
      field.toLowerCase() === "survey_completed_on" ||
      field.toLowerCase() === "survey completed on "
    );
    setSurveyCompletionDateField(surveyCompletedOnField || detectedDateFields[0] || "");

    setCleanedReports(initialCleanedReports);
    setShowFieldSelection(true);
    setReports(data);
    setDreamsLoaded(true);
  } else {
    console.error("No data found in the loaded file.");
  }
};
  
   const handleLoadSavedScoring = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (result) => {
          const data = result.data;
          console.log("Loaded Scoring Data:", data);

          const loadedEditedReports = {};
          const loadedProcessedReports = {};
          const loadedCleanedReports = {};

          data.forEach((row) => {
            const reportKey = `${row.ID}_${row.Source}_${row.SurveyCompletedOn}`;
            loadedEditedReports[reportKey] = {
              participantId: row.ID,
              reportContent: row.DreamReport,
              source: row.Source,
              surveyCompletedOn: row.SurveyCompletedOn,
            };
            if (row.Status === "Processed") {
              loadedProcessedReports[reportKey] = true;
            }
            if (row.CleanedReport) {
              loadedCleanedReports[reportKey] = row.CleanedReport;
            }
          });

          setEditedReports(loadedEditedReports);
          setProcessedReports(loadedProcessedReports);
          setCleanedReports(prevCleanedReports => ({...prevCleanedReports, ...loadedCleanedReports}));
        },
      });
    }
  };

  const flattenReports = (data, idField, reportFields, dateField) => {
    if (!idField || reportFields.length === 0 || !dateField) {
      console.error("No valid fields provided for flattening reports.");
      return [];
    }

    const flattened = [];
    data.forEach((row) => {
      reportFields.forEach((field) => {
        if (row[field] && row[field].trim() !== "") {
          const reportKey = `${row[idField]}_${field}_${row[dateField]}`;
          flattened.push({
            participantId: row[idField],
            reportField: field,
            reportContent: row[field],
            cleanedContent: cleanedReports[reportKey] || row[`Cleaned_${field}`] || null,
            surveyCompletedOn: row[dateField] || "",
          });
        }
      });
    });

    return flattened;
  };

  const handleIdFieldSelection = (e) => {
    setSelectedIdField(e.target.value);
  };

  const handleReportFieldSelection = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setSelectedReportFields(selectedOptions);
  };

  const handleSurveyCompletionDateFieldSelection = (e) => {
    setSurveyCompletionDateField(e.target.value);
  };

  const handleFieldSelectionSubmit = () => {
    if (selectedIdField && selectedReportFields.length > 0 && surveyCompletionDateField) {
      const flattened = flattenReports(reports, selectedIdField, selectedReportFields, surveyCompletionDateField);
      if (flattened.length > 0) {
        setSingleReports(flattened);
        setSelectedReportIndex(0);
        setShowFieldSelection(false);
      } else {
        console.error("Flattening reports resulted in an empty array.");
      }
    } else {
      console.error("Please select an ID field, at least one report field, and a survey completion date field.");
    }
  };

  const handleNext = () => {
    if (selectedReportIndex < singleReports.length - 1) {
      setSelectedReportIndex(selectedReportIndex + 1);
    } else {
      // If it's the last report, mark it as processed
      handleConfirmChecked();
    }
  };

  const handlePrev = () => {
    if (selectedReportIndex > 0) {
      setSelectedReportIndex(selectedReportIndex - 1);
    }
  };

  const handleReportDropdownChange = (e) => {
    setSelectedReportIndex(Number(e.target.value));
  };

  const handleReportEdit = (e) => {
    const editedContent = e.target.value;
    const currentReport = singleReports[selectedReportIndex];
    const reportKey = `${currentReport.participantId}_${currentReport.reportField}_${currentReport.surveyCompletedOn}`;

    setEditedReports({
      ...editedReports,
      [reportKey]: {
        participantId: currentReport.participantId,
        reportContent: editedContent,
        source: currentReport.reportField,
        surveyCompletedOn: currentReport.surveyCompletedOn,
      },
    });

    // Update cleanedReports when a report is edited
    setCleanedReports({
      ...cleanedReports,
      [reportKey]: editedContent,
    });
  };

  const handleConfirmChecked = () => {
    const currentReport = singleReports[selectedReportIndex];
    const reportKey = `${currentReport.participantId}_${currentReport.reportField}_${currentReport.surveyCompletedOn}`;
    setProcessedReports({
      ...processedReports,
      [reportKey]: true,
    });
  };

  const handleConfirmCheckedAndNext = () => {
    handleConfirmChecked();
    handleNext();
  };

  // ... (continued from Part 3)

  const handleRestoreOriginal = () => {
    const currentReport = singleReports[selectedReportIndex];
    if (!currentReport) return;

    const reportKey = `${currentReport.participantId}_${currentReport.reportField}_${currentReport.surveyCompletedOn}`;
    
    // Remove the edited version
    const newEditedReports = { ...editedReports };
    delete newEditedReports[reportKey];
    setEditedReports(newEditedReports);

    // Remove the cleaned version
    const newCleanedReports = { ...cleanedReports };
    delete newCleanedReports[reportKey];
    setCleanedReports(newCleanedReports);

    // Mark as unprocessed
    const newProcessedReports = { ...processedReports };
    delete newProcessedReports[reportKey];
    setProcessedReports(newProcessedReports);

    // Reset the cleaned content
    const updatedSingleReports = [...singleReports];
    updatedSingleReports[selectedReportIndex] = {
      ...currentReport,
      cleanedContent: null
    };
    setSingleReports(updatedSingleReports);
  };

  const getHighlightedReport = (original, cleaned, edited) => {
    if (!original) return "";
    
    if (edited) {
      return trackChanges(original, edited);
    } else if (cleaned) {
      return trackChanges(original, cleaned);
    }
    
    return original;
  };

  const handleSplitDream = () => {
    const currentReport = singleReports[selectedReportIndex];
    if (!currentReport) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;

    if (selectionStart === selectionEnd) {
      alert("Please select the text you want to move to a new dream report.");
      return;
    }

    const reportKey = `${currentReport.participantId}_${currentReport.reportField}_${currentReport.surveyCompletedOn}`;
    const currentContent = editedReports[reportKey]?.reportContent || cleanedReports[reportKey] || currentReport.reportContent;

    const firstHalf = currentContent.slice(0, selectionStart) + currentContent.slice(selectionEnd);
    const selectedText = currentContent.slice(selectionStart, selectionEnd);

    // Update the current report with the remaining text
    setEditedReports({
      ...editedReports,
      [reportKey]: {
        ...editedReports[reportKey],
        reportContent: firstHalf,
      },
    });

    // Update the cleaned report for the current report
    setCleanedReports({
      ...cleanedReports,
      [reportKey]: firstHalf,
    });

    // Use the user-provided field name or generate a new one
    let newReportField = newReportFieldName || `${currentReport.reportField}_split`;
    let newReportKey = `${currentReport.participantId}_${newReportField}_${currentReport.surveyCompletedOn}`;

    // Add the new report to singleReports
    const newReport = {
      participantId: currentReport.participantId,
      reportField: newReportField,
      reportContent: selectedText,
      cleanedContent: selectedText,
      surveyCompletedOn: currentReport.surveyCompletedOn,
    };

    const updatedSingleReports = [...singleReports, newReport];
    setSingleReports(updatedSingleReports);

    // Add the new report to editedReports and cleanedReports
    setEditedReports({
      ...editedReports,
      [newReportKey]: {
        participantId: currentReport.participantId,
        reportContent: selectedText,
        source: newReportField,
        surveyCompletedOn: currentReport.surveyCompletedOn,
      },
    });

    setCleanedReports({
      ...cleanedReports,
      [newReportKey]: selectedText,
    });

    // Set the selected report index to the new report
    setSelectedReportIndex(updatedSingleReports.length - 1);

    // Clear the new report field name input
    setNewReportFieldName('');
  };

  const handleRemoveDream = () => {
    const currentReport = singleReports[selectedReportIndex];
    if (!currentReport) return;

    const reportKey = `${currentReport.participantId}_${currentReport.reportField}_${currentReport.surveyCompletedOn}`;
    
    // Update the report content to "NA"
    setEditedReports({
      ...editedReports,
      [reportKey]: {
        ...editedReports[reportKey],
        reportContent: "NA",
      },
    });

    // Update the cleaned report content to "NA"
    setCleanedReports({
      ...cleanedReports,
      [reportKey]: "NA",
    });

    // Mark as processed
    setProcessedReports({
      ...processedReports,
      [reportKey]: true,
    });

    // Move to the next report
    handleNext();
  };

 // ... (continued from Part 4)

  const handleSaveToCSV = () => {
    const cleanedData = singleReports.map((report) => {
      const reportKey = `${report.participantId}_${report.reportField}_${report.surveyCompletedOn}`;
      const finalReport = editedReports[reportKey]?.reportContent || 
                          cleanedReports[reportKey] || 
                          report.cleanedContent || 
                          report.reportContent;

      return {
        ID: report.participantId,
        DreamReport: finalReport,
        Source: report.reportField,
        Status: processedReports[reportKey] ? "Processed" : "Not Processed",
        SurveyCompletedOn: report.surveyCompletedOn,
      };
    }).filter(report => report.DreamReport.trim() !== "" && report.DreamReport !== "NA"); // Exclude empty reports and removed dreams

    const csvContent = Papa.unparse(cleanedData);

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.-]/g, "_");
    link.href = url;
    link.setAttribute("download", `dream_reports_final_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Functions to replace names, places, and experimenter names with placeholders
  const handleReplaceName = () => {
    if (nameInput.trim() === "") return;

    const currentReport = singleReports[selectedReportIndex];
    if (!currentReport) return;

    const reportKey = `${currentReport.participantId}_${currentReport.reportField}_${currentReport.surveyCompletedOn}`;
    const currentContent = editedReports[reportKey]?.reportContent || cleanedReports[reportKey] || currentReport.reportContent;

    // Get existing name replacements for this report
    const existingReplacements = (currentContent.match(/\[NAME\d+\]/g) || []).map(match => parseInt(match.slice(5, -1)));
    const nextNameNumber = existingReplacements.length > 0 ? Math.max(...existingReplacements) + 1 : 1;

    const regex = new RegExp(`\\b${nameInput}\\b`, 'gi');
    const newContent = currentContent.replace(regex, `[NAME${nextNameNumber}]`);

    setEditedReports({
      ...editedReports,
      [reportKey]: {
        ...editedReports[reportKey],
        reportContent: newContent,
      },
    });

    // Update cleanedReports when anonymizing
    setCleanedReports({
      ...cleanedReports,
      [reportKey]: newContent,
    });

    setNameInput("");
  };

  const handleReplacePlace = () => {
    if (placeInput.trim() === "") return;

    const currentReport = singleReports[selectedReportIndex];
    if (!currentReport) return;

    const reportKey = `${currentReport.participantId}_${currentReport.reportField}_${currentReport.surveyCompletedOn}`;
    const currentContent = editedReports[reportKey]?.reportContent || cleanedReports[reportKey] || currentReport.reportContent;

    const existingReplacements = (currentContent.match(/\[PLACE\d+\]/g) || []).map(match => parseInt(match.slice(6, -1)));
    const nextPlaceNumber = existingReplacements.length > 0 ? Math.max(...existingReplacements) + 1 : 1;

    const regex = new RegExp(`\\b${placeInput}\\b`, 'gi');
    const newContent = currentContent.replace(regex, `[PLACE${nextPlaceNumber}]`);

    setEditedReports({
      ...editedReports,
      [reportKey]: {
        ...editedReports[reportKey],
        reportContent: newContent,
      },
    });

    // Update cleanedReports when anonymizing
    setCleanedReports({
      ...cleanedReports,
      [reportKey]: newContent,
    });

    setPlaceInput("");
  };

  const handleReplaceExperimenter = () => {
    if (experimenterInput.trim() === "") return;

    const currentReport = singleReports[selectedReportIndex];
    if (!currentReport) return;

    const reportKey = `${currentReport.participantId}_${currentReport.reportField}_${currentReport.surveyCompletedOn}`;
    const currentContent = editedReports[reportKey]?.reportContent || cleanedReports[reportKey] || currentReport.reportContent;

    const existingReplacements = (currentContent.match(/\[EXPERIMENTER\d+\]/g) || []).map(match => parseInt(match.slice(13, -1)));
    const nextExperimenterNumber = existingReplacements.length > 0 ? Math.max(...existingReplacements) + 1 : 1;

    const regex = new RegExp(`\\b${experimenterInput}\\b`, 'gi');
    const newContent = currentContent.replace(regex, `[EXPERIMENTER${nextExperimenterNumber}]`);

    setEditedReports({
      ...editedReports,
      [reportKey]: {
        ...editedReports[reportKey],
        reportContent: newContent,
      },
    });

    // Update cleanedReports when anonymizing
    setCleanedReports({
      ...cleanedReports,
      [reportKey]: newContent,
    });

    setExperimenterInput("");
  };

  return (
    <div className="App">
      <h1>Dream Report Processor</h1>

      <div className="step step-1">
        <h2>Step 1: Import Dreams</h2>
        <p>Import the original dream reports file (.csv or .xlsx). This file should contain the original, unedited dream reports.</p>
        <input 
          type="file" 
          accept=".csv,.xlsx" 
          onChange={handleLoadReports} 
          id="dreams-import"
        />
      </div>

      {dreamsLoaded && (
        <div className="step step-2">
          <h2>Step 2: Load Previous Work (Optional)</h2>
          <p>If you have a previously saved file with your edits, you can load it here.</p>
          <input 
            type="file" 
            accept=".csv,.xlsx" 
            onChange={handleLoadSavedScoring} 
            id="previous-work-import"
          />
        </div>
      )}

      {showFieldSelection && (
        <div className="step step-3">
          <h3>Select Fields</h3>

          <label>ID Field: </label>
          <select onChange={handleIdFieldSelection} value={selectedIdField}>
            <option value="">Select ID Field</option>
            {idFieldOptions.map((field, index) => (
              <option key={index} value={field}>
                {field}
              </option>
            ))}
          </select>

          <label>Report Fields (multiple): </label>
          <select 
            multiple 
            onChange={handleReportFieldSelection} 
            value={selectedReportFields}
            size={10}
          >
            {reportFieldOptions.map((field, index) => (
              <option key={index} value={field}>
                {field}
              </option>
            ))}
          </select>

          <label>Survey Completion Date Field: </label>
          <select onChange={handleSurveyCompletionDateFieldSelection} value={surveyCompletionDateField}>
            <option value="">Select Survey Completion Date Field</option>
            {dateFieldOptions.map((field, index) => (
              <option key={index} value={field}>
                {field}
              </option>
            ))}
          </select>

          <button onClick={handleFieldSelectionSubmit}>Submit Fields</button>
        </div>
      )}

      {singleReports.length === 0 && !showFieldSelection && <p className="no-dreams-yet">No dream reports available to display.</p>}

      {singleReports.length > 0 && !showFieldSelection && (
        <div className="step step-4">
          <div className="report-buttons">
            <button onClick={handlePrev} disabled={selectedReportIndex === 0}>
              Previous
            </button>
            <button onClick={handleNext}>
              Next
            </button>
            <button onClick={handleConfirmCheckedAndNext}>
              Confirm Processed & Next
            </button>
            <button onClick={handleRestoreOriginal}>
              Restore Original
            </button>
            <button onClick={handleRemoveDream}>
              Remove Dream
            </button>
            <div>
              <input
                type="text"
                value={newReportFieldName}
                onChange={(e) => setNewReportFieldName(e.target.value)}
                placeholder="Enter new report field name for split"
              />
              <button onClick={handleSplitDream}>
                Split Dream
              </button>
            </div>
          </div>

          <label>Select Report: </label>
          <select value={selectedReportIndex} onChange={handleReportDropdownChange}>
            {singleReports.map((report, index) => (
              <option key={index} value={index}>
                {`Participant: ${report.participantId} - ${report.reportField} - ${report.surveyCompletedOn} (${processedReports[`${report.participantId}_${report.reportField}_${report.surveyCompletedOn}`] ? "Processed" : "Not Processed"})`}
              </option>
            ))}
          </select>

          <p className="status-container">
            <span className="status-label">Status:</span>{" "}
            {processedReports[`${singleReports[selectedReportIndex]?.participantId}_${singleReports[selectedReportIndex]?.reportField}_${singleReports[selectedReportIndex]?.surveyCompletedOn}`]
              ? "Processed"
              : "Not Processed"}
          </p>

          <div className="report-container">
            <div className="report-container-left">
              <div className="reportDisplay report-display-original">
                <h2>Original Report (with changes highlighted):</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: getHighlightedReport(
                      singleReports[selectedReportIndex]?.reportContent,
                      singleReports[selectedReportIndex]?.cleanedContent,
                      editedReports[`${singleReports[selectedReportIndex]?.participantId}_${singleReports[selectedReportIndex]?.reportField}_${singleReports[selectedReportIndex]?.surveyCompletedOn}`]?.reportContent ||
                      cleanedReports[`${singleReports[selectedReportIndex]?.participantId}_${singleReports[selectedReportIndex]?.reportField}_${singleReports[selectedReportIndex]?.surveyCompletedOn}`]
                    ),
                  }}
                />
              </div>

              <div className="reportDisplay">
                <h2>Participant ID: {singleReports[selectedReportIndex]?.participantId}</h2>
                <h3>Report Field: {singleReports[selectedReportIndex]?.reportField}</h3>
                <h3>Survey Date: {singleReports[selectedReportIndex]?.surveyCompletedOn}</h3>
                <textarea
                  ref={textareaRef}
                  value={
                    editedReports[`${singleReports[selectedReportIndex]?.participantId}_${singleReports[selectedReportIndex]?.reportField}_${singleReports[selectedReportIndex]?.surveyCompletedOn}`]?.reportContent ||
                    cleanedReports[`${singleReports[selectedReportIndex]?.participantId}_${singleReports[selectedReportIndex]?.reportField}_${singleReports[selectedReportIndex]?.surveyCompletedOn}`] ||
                    singleReports[selectedReportIndex]?.cleanedContent ||
                    singleReports[selectedReportIndex]?.reportContent ||
                    ""
                  }
                  onChange={handleReportEdit}
                  rows="10"
                  cols="50"
                  disabled={singleReports.length === 0}
                />
              </div>
            </div>
            <div className="report-container-right">
              <div className="anonymization">
                <h3>Manual Anonymization</h3>
                <div>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter name to replace"
                    disabled={singleReports.length === 0}
                  />
                  <button onClick={handleReplaceName} disabled={singleReports.length === 0}>Replace Name</button>
                </div>
                <div>
                  <input
                    type="text"
                    value={placeInput}
                    onChange={(e) => setPlaceInput(e.target.value)}
                    placeholder="Enter place to replace"
                    disabled={singleReports.length === 0}
                  />
                  <button onClick={handleReplacePlace} disabled={singleReports.length === 0}>Replace Place</button>
                </div>
                <div>
                  <input
                    type="text"
                    value={experimenterInput}
                    onChange={(e) => setExperimenterInput(e.target.value)}
                    placeholder="Enter experimenter name to replace"
                    disabled={singleReports.length === 0}
                  />
                  <button onClick={handleReplaceExperimenter} disabled={singleReports.length === 0}>Replace Experimenter</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {Object.keys(processedReports).length > 0 && (
        <button onClick={handleSaveToCSV}>Save Cleaned Reports to CSV</button>
      )}
    </div>
  );
}

ReactDOM.render(<DreamReportProcessor />, document.getElementById("root"));