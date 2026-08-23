import { useState, useEffect } from 'react';

const AssignmentPanel = () => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    studentName: '',
    billNo: '',
    mobileNumber: ''
  });

  // Error state
  const [error, setError] = useState({
    studentName: '',
    billNo: '',
    mobileNumber: ''
  });

  // Mount animation
  useEffect(() => {
    setVisible(true);
    setClosing(true);
  }, []);

  // Trigger enter animation after first paint
  useEffect(() => {
    if (visible) {
      const id = requestAnimationFrame(() => {
        setClosing(false);
      });
      return () => cancelAnimationFrame(id);
    }
  }, [visible]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
    }, 300);
  };

  const handleSave = () => {
    // Validate all fields
    const newError = { ...error };
    let isValid = true;

    // Student name validation
    if (!formData.studentName.trim()) {
      newError.studentName = 'Student name is required';
      isValid = false;
    } else {
      newError.studentName = '';
    }

    // Bill number validation
    if (!formData.billNo.trim()) {
      newError.billNo = 'Bill number is required';
      isValid = false;
    } else {
      newError.billNo = '';
    }

    // Mobile number validation (exactly 10 digits)
    if (formData.mobileNumber.length !== 10) {
      newError.mobileNumber = 'Mobile number must be exactly 10 digits';
      isValid = false;
    } else {
      newError.mobileNumber = '';
    }

    setError(newError);

    if (!isValid) {
      return; // Prevent save if any validation fails
    }

    // Proceed with save logic (example)
    console.log('Saving assignment:', formData);
    // Reset form after save
    setFormData({
      studentName: '',
      billNo: '',
      mobileNumber: ''
    });
    setError({
      studentName: '',
      billNo: '',
      mobileNumber: ''
    });
    handleClose(); // Close panel after save
  };

  return (
    <>
      {/* Backdrop */}
      {visible && (
        <div
          className={`fixed inset-0 z-40 bg-black/50
            ${!closing ? 'opacity-100' : 'opacity-0'}
            transition-opacity duration-300 ease-out
          `}
          onClick={handleClose}
        />
      )}

      {/* Panel */}
      {visible && (
        <div className={`fixed inset-0 z-50 flex items-end
          ${!closing ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
          transition-transform transition-opacity duration-300 ease-out
        `}>
          {/* Panel content */}
          <div className="flex h-full w-64 flex-col bg-white shadow-lg p-4">
            <h2 className="text-xl font-bold mb-4">Add Assignment</h2>

            {/* Student Name Input */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Student Name</label>
              <input
                type="text"
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {error.studentName && <p className="mt-1 text-sm text-red-600">{error.studentName}</p>}
            </div>

            {/* Bill Number Input */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Bill Number</label>
              <input
                type="text"
                value={formData.billNo}
                onChange={(e) => setFormData({ ...formData, billNo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {error.billNo && <p className="mt-1 text-sm text-red-600">{error.billNo}</p>}
            </div>

            {/* Mobile Number Input - WITH VALIDATION */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Mobile Number</label>
              <input
                type="tel"
                value={formData.mobileNumber}
                onChange={(e) => {
                  // Sanitization: remove non-digits and limit to 10 characters
                  const sanitized = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, mobileNumber: sanitized });
                }}
                maxLength={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter 10-digit mobile number"
              />
              {/* Inline error message for mobile number */}
              {error.mobileNumber && <p className="mt-1 text-sm text-red-600">{error.mobileNumber}</p>}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                // Disable save button if any field is invalid
                disabled={!!error.studentName || !!error.billNo || !!error.mobileNumber}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
  </>
  );
};

export default AssignmentPanel;