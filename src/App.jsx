
import React, { useState, useEffect } from 'react';
import { Select } from "antd";
// import { FaEdit, FaSave } from "react-icons/fa";
import { FaEdit, FaSave, FaSpinner } from "react-icons/fa";
function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndent, setSelectedIndent] = useState('');
  const [selectedAdmission, setSelectedAdmission] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('');
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRows, setEditingRows] = useState({});
  const [selectedRows, setSelectedRows] = useState({});
  const [approvalData, setApprovalData] = useState({});
  // const [medicineOptions, setMedicineOptions] = useState([]);
  const [masterData, setMasterData] = useState({});
  const { Option } = Select;
  const [loadingRow, setLoadingRow] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedWardType, setSelectedWardType] = useState('');


  // Pagination state variables
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(1000);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalRows, setTotalRows] = useState(0);

  const BACKEND_URL = "https://script.google.com/macros/s/AKfycbyfmWBK4ikZUFM5u2nYm9sVG_IlTcNNnR0yI0tCWZmh6VPQVccvV6uxK6eWigljguo4Tg/exec";



  const fetchMasterSheet = async (page = 1) => {
    console.log("🔹 fetchMasterSheet called with page:", page, "✅");
    try {
      const response = await fetch(`https://script.google.com/macros/s/AKfycbx_ffGXIZelQ3qCR_QuWT1hhQ3UZwjUjgl4Gnb3GpxcAHuUj206Kw3iGZV_qfCmmKk/exec?sheet=Pharmacy's%20Details&page=${page}&pageSize=${pageSize}`);

      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const headers = result.data[0]; // First row contains headers
        const structuredData = page === 1 ? {} : { ...masterData };

        // Initialize each header with an empty array (only on first page)
        if (page === 1) {
          headers.forEach((header) => {
            structuredData[header] = [];
          });
        }

        // Process each data row (skip the header row)
        result.data.slice(1).forEach((row) => {
          row.forEach((value, index) => {
            const header = headers[index];
            if (value !== null && value !== undefined) {
              const stringValue = String(value).trim();
              if (stringValue !== "") {
                structuredData[header].push(stringValue);
              }
            }
          });
        });

        // Remove duplicates from each array
        Object.keys(structuredData).forEach((key) => {
          structuredData[key] = [...new Set(structuredData[key])];
        });

        setMasterData(structuredData);
        console.log("✅ Master Data fetched for page", page, ":", structuredData);

        // Check if there's more data
        const hasMore = result.pagination ? result.pagination.hasMore : false;

        return { data: structuredData, hasMore };
      }
    } catch (error) {
      console.error("Error fetching master data:", error);
      throw error; // Re-throw to handle in calling function
    }
  };

  // Optimized filtering function with useMemo equivalent logic
  const applyFilters = React.useCallback(() => {
    console.log("🔹 Applying filters to", tableData.length, "rows");

    if (tableData.length === 0) {
      setFilteredData([]);
      return;
    }

    const filtered = tableData.filter((row) => {
      // Early return for empty filters
      if (!searchTerm && !selectedIndent && !selectedAdmission && !selectedStaff && !selectedDiagnosis) {
        return true;
      }

      // Dropdown filters (most selective first for early exit)
      if (selectedIndent && row.indentNumber !== selectedIndent) return false;
      if (selectedAdmission && row.admissionNo !== selectedAdmission) return false;
      if (selectedStaff && row.staffName !== selectedStaff) return false;
      if (selectedDiagnosis && row.diagnosis !== selectedDiagnosis) return false;
      if (selectedWardType && row.wardType !== selectedWardType) return false;


      // Search filter (most expensive, do last)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const searchableText = `${row.timestamp} ${row.indentNumber} ${row.serialNumber} ${row.admissionNo} ${row.staffName} ${row.consultantName} ${row.patientName} ${row.huidNo} ${row.age} ${row.gender} ${row.diagnosis} ${row.wardType} ${row.category} ${row.floorLocation} ${row.requestType} ${row.medicineName} ${row.quantity}`.toLowerCase();
        if (!searchableText.includes(searchLower)) return false;
      }

      return true;
    });

    console.log("🔹 Filtered", filtered.length, "rows from", tableData.length, "total rows");
    setFilteredData(filtered);
  }, [tableData, searchTerm, selectedIndent, selectedAdmission, selectedStaff, selectedDiagnosis]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchData = async (page = 1, append = false) => {
    console.log("🔹 fetchData called with page:", page, "append:", append, "✅");
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      console.log("🔹 Fetching from URL:", `${BACKEND_URL}?sheet=INDENT&page=${page}&pageSize=${pageSize}`);

      // First, ensure master data is available
      let masterSheetData = masterData;
      if (!masterSheetData || Object.keys(masterSheetData).length === 0) {
        console.log("🔹 Master data not available, fetching...");
        const masterResult = await fetchMasterSheet(1);
        masterSheetData = masterResult.data;
      }

      const response = await fetch(`${BACKEND_URL}?sheet=INDENT&page=${page}&pageSize=${pageSize}`);
      console.log("🔹 Response status:", response.status);

      const data = await response.json();
      console.log("🔹 Raw Data from backend:", data);

      if (data.success && data.data) {
        const headers = data.data[0]; // First row contains headers
        console.log("🔹 Headers:", headers);

        let rows = data.data;
        if (page === 1) {

          rows = data.data.slice(6); // Skip header row
        }

        console.log("🔹 Total Rows fetched for page", page, ":", rows.length);

        // Update pagination info
        if (data.pagination) {
          setTotalRows(data.pagination.totalRows);
          setHasMoreData(data.pagination.hasMore);
        } else {
          // If no pagination info, assume no more data
          setHasMoreData(false);
        }

        // Map column indices
        const columnMap = {
          timestamp: 0,      // Column A
          indentNumber: 1,   // Column B
          serialNumber: 2,   // Column C
          admissionNo: 3,    // Column D
          staffName: 4,      // Column E
          consultantName: 5, // Column F
          patientName: 6,    // Column G
          huidNo: 7,         // Column H
          age: 8,            // Column I
          gender: 9,         // Column J
          diagnosis: 10,     // Column K
          wardLocation: 11,  // Column L
          category: 12,      // Column M
          floorName: 13,     // Column N
          requestType: 14,   // Column O
          medicineName: 15,  // Column P
          quantity: 16,      // Column Q
          planned1: 17,      // Column R
          approvedBy: 20,    // Column U
          status1: 18,       // Column V
        };

        // ✅ Optimized filtering + transformation
        const transformedData = rows
          .map((row, idx) => ({ row, idx }))
          .filter(({ row }) =>
            row[columnMap.planned1] && row[columnMap.planned1] !== '' &&
            (!row[columnMap.status1] || row[columnMap.status1] === '')
          )
          .map(({ row, idx }) => {
            const sheetRowIndex = idx + 6; // direct index, no indexOf
            const requestType = (row[columnMap.requestType] || '').toLowerCase().trim();
            let medicineOptions = [];

            // Conditional logic based on Request Type
            if (requestType.includes('medicine')) {
              medicineOptions = masterSheetData['Medicine Name'] || [];
            } else if (requestType.includes('investigation')) {
              medicineOptions = masterSheetData['Investigation Name'] || [];
            }

            // Create unique id using indent number and serial number
            const uniqueId = `${row[columnMap.indentNumber]} ${row[columnMap.serialNumber]}`;

            return {
              id: uniqueId, // Changed from index + 1 to unique format
              sheetRowIndex,
              timestamp: row[columnMap.timestamp] || '',
              indentNumber: row[columnMap.indentNumber] || '',
              serialNumber: row[columnMap.serialNumber] || '',
              admissionNo: row[columnMap.admissionNo] || '',
              staffName: row[columnMap.staffName] || '',
              consultantName: row[columnMap.consultantName] || '',
              patientName: row[columnMap.patientName] || '',
              huidNo: row[columnMap.huidNo] || '',
              age: row[columnMap.age] || '',
              gender: row[columnMap.gender] || '',
              diagnosis: row[columnMap.diagnosis] || '',
              wardType: row[columnMap.wardLocation] || '',
              category: row[columnMap.category] || '',
              floorLocation: row[columnMap.floorName] || '',
              requestType: row[columnMap.requestType] || '',
              medicineName: row[columnMap.medicineName] || '',
              quantity: row[columnMap.quantity] || '',
              approvedBy: row[columnMap.approvedBy] || '',
              status: row[columnMap.status1] || '',
              planned1: row[columnMap.planned1],
              actual1: row[columnMap.status1],
              medicineOptions: medicineOptions
            };
          });

        console.log("🔹 Final Transformed Data with medicineOptions for page", page, ":", transformedData);

        if (append) {
          // Append to existing data
          setTableData(prevData => [...prevData, ...transformedData]);
        } else {
          // Replace data (first page)
          setTableData(transformedData);
        }
      } else {
        console.warn("⚠️ Backend response invalid:", data);
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error);
    } finally {
      if (!append) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
      console.log("🔹 fetchData finished for page", page, "✅");
    }
  };


  const loadMoreData = async () => {
    if (!hasMoreData || loadingMore) {
      return;
    }

    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await fetchData(nextPage, true);
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchMasterSheet(1); // First fetch master data
        await fetchData(1, false); // Then fetch and process INDENT data
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };

    initializeData();
  }, []);


  const handleEdit = async (indentNo, serialNo) => {
    const rowId = `${indentNo} ${serialNo}`;
    console.log("🔹 handleEdit called for rowId:", rowId);

    // Check if the row exists
    const row = tableData.find(r => r.id === rowId);
    if (!row) {
      alert("Row not found!");
      return;
    }

    // If already in edit mode, save the changes
    if (editingRows[rowId]) {
      setLoadingRow(rowId);

      try {
        const actualRowIndex = row.sheetRowIndex;

        // Update medicine name (column P = 16)
        const medicineResponse = await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            action: "updateCell",
            sheetName: "INDENT",
            rowIndex: actualRowIndex,
            columnIndex: 16, // Column P (Medicine Name)
            value: row.medicineName || ""
          })
        });

        // Update quantity (column Q = 17)
        const quantityResponse = await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            action: "updateCell",
            sheetName: "INDENT",
            rowIndex: actualRowIndex,
            columnIndex: 17, // Column Q (Quantity)
            value: row.quantity || ""
          })
        });

        const medicineResult = await medicineResponse.json();
        const quantityResult = await quantityResponse.json();

        console.log("🔹 Medicine Update Result:", medicineResult);
        console.log("🔹 Quantity Update Result:", quantityResult);

        if (medicineResult.success && quantityResult.success) {
          alert("Row updated successfully!");
        } else {
          alert("Error updating row: " + (medicineResult.error || quantityResult.error));
        }

      } catch (err) {
        console.error("Error updating row:", err);
        alert("Error updating row. Please try again.");
      } finally {
        setLoadingRow(null);
      }
    }

    // Toggle edit mode for this specific row
    setEditingRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };




  const handleSelect = (rowId) => {
    setSelectedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  const handleMedicineChange = (rowId, medicine) => {
    setTableData(prev => prev.map(row =>
      row.id === rowId ? { ...row, medicineName: medicine } : row
    ));
  };

  const handleQuantityChange = (rowId, quantity) => {
    setTableData(prev => prev.map(row =>
      row.id === rowId ? { ...row, quantity: quantity } : row
    ));
  };

  const handleApprovalDataChange = (rowId, field, value) => {
    setApprovalData(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const submissionData = [];

      // Collect data from selected rows
      Object.keys(selectedRows).forEach(rowId => {
        if (selectedRows[rowId]) {
          const row = tableData.find(r => r.id === rowId); // Use string comparison for unique IDs
          const approval = approvalData[rowId] || {};

          if (row) {
            submissionData.push([
              row.timestamp,
              row.indentNumber,
              row.serialNumber,
              approval.approvedBy || '',
              approval.status || '',
              row.medicineName,
              row.quantity,
            ]);
          }
        }
      });

      if (submissionData.length === 0) {
        alert('Please select at least one row to submit.');
        return;
      }

      const invalidRows = submissionData.filter(
        (row) => !row.approvedBy || !row.status
      );
      if (invalidRows.length > 0) {
        alert('Please fill both "Approved By" and "Status" for all selected rows before submitting.');
        return;
      }


      // Submit each row individually
      const promises = submissionData.map(rowData =>
        fetch(BACKEND_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            action: 'insert',
            sheetName: 'Approved',
            rowData: JSON.stringify(rowData)
          })
        })
      );

      const results = await Promise.all(promises);
      const responses = await Promise.all(results.map(r => r.json()));

      const allSuccessful = responses.every(r => r.success);

      if (allSuccessful) {
        alert('Data submitted successfully!');
        setSelectedRows({});
        setEditingRows({});
        setApprovalData({});
        // Reset pagination and reload data
        setCurrentPage(1);
        setTableData([]);
        setHasMoreData(true);
        fetchData(1, false);
      } else {
        const failedResponses = responses.filter(r => !r.success);
        alert('Some submissions failed: ' + failedResponses.map(r => r.error).join(', '));
      }
    } catch (error) {
      console.error('Error submitting data:', error);
      alert('Error submitting data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get unique values for dropdowns
  const uniqueIndentNumbers = [...new Set(tableData.map(row => row.indentNumber))].filter(Boolean);
  const uniqueAdmissionNos = [...new Set(tableData.map(row => row.admissionNo))].filter(Boolean);
  const uniqueStaffNames = [...new Set(tableData.map(row => row.staffName))].filter(Boolean);
  const uniqueDiagnoses = [...new Set(tableData.map(row => row.diagnosis))].filter(Boolean);
  const uniqueWardTypes = [...new Set(tableData.map(row => row.wardType))].filter(Boolean);



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-10 px-10">
        {/* Empty header with just margin and background color as requested */}
      </div>

      {/* Main Section */}
      <div className="w-full px-6 py-8 ">
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-end gap-4 flex-wrap">

            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="search across all field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-50 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Indent Number Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Indent Number</label>
              <Select
                size="large"
                showSearch
                value={selectedIndent}
                onChange={(value) => {
                  if (value === "all") {
                    setSelectedIndent(""); // ✅ "all" ka matlab sab dikhana
                  } else {
                    setSelectedIndent(value);
                  }
                }}
                placeholder="Select Indent"
                className="w-48"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {/* Extra option for Select All */}
                <Option key="all" value="all">All Indents</Option>

                {uniqueIndentNumbers.map(indent => (
                  <Option key={indent} value={indent}>{indent}</Option>
                ))}
              </Select>
            </div>


            {/* Admission No Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admission No.</label>
              <Select
                size="large"
                showSearch
                value={selectedAdmission}
                onChange={(value) => {
                  if (value === "all") {
                    setSelectedAdmission(""); // ✅ "all" ka matlab sab admission show karna
                  } else {
                    setSelectedAdmission(value);
                  }
                }}
                placeholder="Select Admission"
                className="w-48"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {/* Extra option for All */}
                <Option key="all" value="all">All Admissions</Option>

                {uniqueAdmissionNos.map(admission => (
                  <Option key={admission} value={admission}>{admission}</Option>
                ))}
              </Select>
            </div>


            {/* Staff Name Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Staff Name</label>
              <Select
                size="large"
                showSearch
                value={selectedStaff}
                onChange={(value) => {
                  if (value === "all") {
                    setSelectedStaff(""); // ✅ "all" select karne par sabhi staff dikhayega
                  } else {
                    setSelectedStaff(value);
                  }
                }}
                placeholder="Select Staff"
                className="w-48"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {/* Extra option for All */}
                <Option key="all" value="all">All Staff</Option>

                {uniqueStaffNames.map(staff => (
                  <Option key={staff} value={staff}>{staff}</Option>
                ))}
              </Select>
            </div>


            {/* Ward Type Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ward Type</label>
              <Select
                size="large"
                showSearch
                value={selectedWardType}
                onChange={(value) => {
                  if (value === "all") {
                    setSelectedWardType(""); // ✅ All select karne par sab show hoga
                  } else {
                    setSelectedWardType(value);
                  }
                }}
                placeholder="Select Ward Type"
                className="w-48"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {/* 👇 All option */}
                <Option key="all" value="all">All Ward Types</Option>

                {uniqueWardTypes.map(ward => (
                  <Option key={ward} value={ward}>{ward}</Option>
                ))}
              </Select>
            </div>



            {/* Diagnosis Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
              <Select
                size="large"
                showSearch
                value={selectedDiagnosis}
                onChange={(value) => {
                  if (value === "all") {
                    setSelectedDiagnosis(""); // ✅ All select karne par sab show hoga
                  } else {
                    setSelectedDiagnosis(value);
                  }
                }}
                placeholder="Select Diagnosis"
                className="w-48"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {/* 👇 All option add kiya */}
                <Option key="all" value="all">All Diagnosis</Option>

                {uniqueDiagnoses.map(diagnosis => (
                  <Option key={diagnosis} value={diagnosis}>{diagnosis}</Option>
                ))}
              </Select>
            </div>



            {/* Submit Button */}
            {/* Submit Button */}
            <div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting} // Disable button while submitting
                className="w-40 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    SUBMITTING...
                  </>
                ) : (
                  'SUBMIT'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Pagination Info */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {tableData.length} of {totalRows || 'many'} records
            </div>
            {hasMoreData && (
              <button
                onClick={loadMoreData}
                disabled={loadingMore}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center"
              >
                {loadingMore ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load More Data'
                )}
              </button>
            )}
          </div>

          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading data...</p>
                </div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">
                      <input
                        type="checkbox"
                        checked={
                          filteredData.length > 0 &&
                          filteredData.every((row) => selectedRows[row.id])
                        }
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const newSelectedRows = {};
                          if (checked) {
                            filteredData.forEach((row) => {
                              newSelectedRows[row.id] = true;
                            });
                          }
                          setSelectedRows(newSelectedRows);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">Indent Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">Serial Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">Admission No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">Staff Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">Consultant Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">Patient Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">HUID No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">Age</th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">Gender</th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">Diagnosis</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">Ward Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">Category</th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">Floor Location</th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">Request Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">Edit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">Medicine Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">Approved By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky top-0 z-10 bg-blue-600">Status</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="21" className="px-6 py-4 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedRows[row.id] || false}
                            onChange={() => handleSelect(row.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>


                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.timestamp}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.indentNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.serialNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.admissionNo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.staffName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.consultantName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.patientName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.huidNo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.age}</td>
                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.gender}</td> */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.diagnosis}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.wardType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.category}</td>
                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.floorLocation}</td> */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.requestType}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(row.indentNumber, row.serialNumber)}
                            className="flex items-center gap-2 hover:scale-110 transition-transform"
                            disabled={loadingRow === row.id}
                          >
                            {loadingRow === row.id ? (
                              <span className="text-blue-600 text-sm font-medium">⏳ Please wait...</span>
                            ) : editingRows[row.id] ? (
                              <>
                                <FaSave className="text-green-600" />
                                <span className="text-green-600 text-sm font-medium">Save</span>
                              </>
                            ) : (
                              <>
                                <FaEdit className="text-red-600" />
                                <span className="text-red-600 text-sm font-medium">Edit</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingRows[row.id] ? ( // ✅ Use row.id to check edit state
                            <Select
                              showSearch
                              placeholder="Select Medicine"
                              value={row.medicineName}
                              onChange={(value) => handleMedicineChange(row.id, value)}
                              optionFilterProp="children"
                              className="w-full"
                            >
                              {row.medicineOptions &&
                                row.medicineOptions.map((medicine) => (
                                  <Option key={medicine} value={medicine}>
                                    {medicine}
                                  </Option>
                                ))}
                            </Select>
                          ) : (
                            row.medicineName
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingRows[row.id] ? ( // ✅ Use row.id to check edit state
                            <input
                              type="number"
                              value={row.quantity}
                              onChange={(e) => handleQuantityChange(row.id, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            row.quantity
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {selectedRows[row.id] ? (
                            <select
                              required
                              value={approvalData[row.id]?.approvedBy || ''}
                              onChange={(e) => handleApprovalDataChange(row.id, 'approvedBy', e.target.value)}
                              className={`w-full px-2 py-1 border rounded text-sm ${!approvalData[row.id]?.approvedBy ? "border-red-500" : "border-gray-300"
                                }`}
                            >
                              <option value="">Select Name</option>
                              <option value="Dr. Ankit">Deepak Sahu</option>
                              <option value="Dr. Ravi">Dr. Pawan Sahu</option>
                              <option value="Dr. Priya">Yogita</option>
                            </select>

                          ) : (
                            row.approvedBy
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {selectedRows[row.id] ? (
                            <select
                              required
                              value={approvalData[row.id]?.status || ''}
                              onChange={(e) => handleApprovalDataChange(row.id, 'status', e.target.value)}
                              className={`px-2 py-1 border rounded text-sm ${!approvalData[row.id]?.status ? "border-red-500" : "border-gray-300"
                                }`}
                            >
                              <option value="">Select Status</option>
                              <option value="Approved">Approved</option>
                              <option value="Rejected">Rejected</option>
                            </select>

                          ) : (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.status === 'Approved' ? 'bg-green-100 text-green-800' :
                              row.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                row.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>
                              {row.status || 'Pending'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Load More Button at bottom of table */}
          {!loading && hasMoreData && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
              <button
                onClick={loadMoreData}
                disabled={loadingMore}
                className="px-6 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center mx-auto"
              >
                {loadingMore ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Loading Next 1000 Records...
                  </>
                ) : (
                  'Load More Data'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Keep as is */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-r from-indigo-800 via-purple-800 to-blue-800 text-white py-3 relative overflow-hidden z-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-purple-600/10 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm text-gray-300">Powered by</span>
            <a
              href="https://www.botivate.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text font-bold text-base hover:from-blue-200 hover:via-purple-200 hover:to-pink-200 transition-all duration-300 cursor-pointer"
            >
              Botivate
            </a>
          </div>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse delay-300"></div>
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-pink-400 to-blue-400 rounded-full animate-pulse delay-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;





