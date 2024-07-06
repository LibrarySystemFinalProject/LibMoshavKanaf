import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaSpinner, FaBell } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

const BookBorrowDetailsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [copies, setCopies] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // Defines the number of items per page

  const navigate = useNavigate();
  const location = useLocation();
  const bookTitle = location.state?.bookTitle;
  const displayName = location.state?.displayName;
  const uid = location.state?.uid;

  useEffect(() => {
    const fetchCopies = async () => {
      try {
        const response = await axios.get(`/api/book/getCopiesByTitle`, { params: { title: bookTitle } });
        if (response.status === 200 && response.data.copies) {
          setCopies(response.data.copies);
        } else {
          setError("לא נמצאו עותקים עבור כותר זה.");
        }
      } catch (error) {
        setError(`נכשל בשליפת עותקים: ${error.response?.data?.message || error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (bookTitle) {
      fetchCopies();
    }
  }, [bookTitle]);

  const handleBorrow = async (copyID) => {
    try {
      // Get book ID using book title
      const bookResponse = await axios.get(`/api/books/names`);
      const book = bookResponse.data.bookNames.find(book => book.title === bookTitle);
  
      if (book) {
        // Remove the user from the waiting list by book ID
        const deleteRequestResponse = await axios.delete(`/api/books/${book.id}/waiting-list`, { data: { uid } });
        if (deleteRequestResponse.data.success) {
          console.log("בקשת השאלה נמחקה בהצלחה");
  
          // Update the borrow information
          const updateBorrowResponse = await axios.put('/api/copies/updateBorrowedTo', { copyID, uid, title: bookTitle });
          if (updateBorrowResponse.data.success) {
            setCopies(prevCopies => prevCopies.map(copy => {
              if (copy.copyID === copyID) {
                return { ...copy, borrowedTo: displayName };
              }
              return copy;
            }));
  
            // Update the status in the user's borrowBooks-list
            const updateStatusResponse = await axios.put(`/api/users/${uid}/borrow-books-list/update-status`, { title: bookTitle });
            if (updateStatusResponse.data.success) {
              console.log("סטטוס רשימת ההשאלות עודכן בהצלחה");
            } else {
              setError("נכשל בעדכון סטטוס רשימת ההשאלות.");
            }
          } else {
            setError("נכשל בעדכון השדה borrowedTo.");
          }
        } else {
          setError("נכשל במחיקת בקשת ההשאלה.");
        }
      } else {
        setError("הספר לא נמצא.");
      }
    } catch (error) {
      setError(`שגיאה בעדכון השדה borrowedTo: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleNotify = async () => {
    try {
      const response1 = await axios.post(`/api/users/${uid}/notifications`, {
        message: `הספר "${bookTitle}" מוכן להשאלה.`
      });
      const response2 = await axios.post(`/api/users/${uid}/send-email`, {
        message: `הספר "${bookTitle}" מוכן להשאלה.`
      });
      if ((response1.data.success) || (response1.data.success)) {
        setSuccessMessage("ההתראה נשלחה בהצלחה");
        setError(""); // Clear any previous error messages
      } else {
        setError("נכשל בשליחת ההתראה.");
        setSuccessMessage(""); // Clear any previous success messages
      }
    } catch (error) {
      setError(`שגיאה בשליחת ההתראה: ${error.response?.data?.message || error.message}`);
      setSuccessMessage(""); // Clear any previous success messages
    }
  };
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = copies.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = pageNumber => setCurrentPage(pageNumber);
  const total_pages = Math.ceil(copies.length / itemsPerPage);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full" dir="rtl">
      <h1 className="text-5xl font-extrabold text-center mb-8 tracking-wide">פרטי השאלה עבור "{bookTitle}"</h1>
      {isLoading ? (
        <div className="flex justify-center items-center">
          <FaSpinner className="animate-spin text-6xl" />
        </div>
      ) : (
        <>
          {copies.length > 0 ? (
            <div className="w-full px-4 flex flex-wrap justify-center gap-4">
              {currentItems.map((copy, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow mb-4" style={{ width: 'calc(40% - 16px)' }}>
                  <div><strong>כותר:</strong> {copy.title}</div>
                  <div><strong>מספר עותק:</strong> {copy.copyID}</div>
                  <div><strong>סטטוס:</strong> {copy.borrowedTo ? `הושאל ל-${copy.borrowedTo}` : "זמין"}</div>
                  {!copy.borrowedTo && (
                    <button
                      className="mt-4 bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded max-w-xs"
                      onClick={() => handleBorrow(copy.copyID)}
                    >
                      השאל ל-{displayName}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div>אין עותקים זמינים לכותר זה.</div>
          )}
          <div className="flex justify-center mt-4">
            {Array.from({ length: total_pages }, (_, index) => (
              <button
                key={index}
                onClick={() => paginate(index + 1)}
                className={`mx-2 px-4 py-2 rounded ${currentPage === index + 1 ? 'bg-gray-700 hover:bg-gray-800 text-white' : 'bg-gray-300'}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <button
            className="flex items-center justify-center mt-8 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded"
            onClick={handleNotify}
          >
            <FaBell className="mr-2" />
            הודע ל-{displayName} שהספר מוכן לאיסוף!
          </button>
        </>
      )}
      {error && <div className="text-red-500 p-3 rounded bg-gray-100 my-2">{error}</div>}
      {successMessage && <div className="text-green-500 p-3 rounded bg-gray-100 my-2">{successMessage}</div>}
      <button onClick={() => navigate(-1)} className="mt-4 bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded">
        חזור
      </button>
    </div>
  );
};

export default BookBorrowDetailsPage;
