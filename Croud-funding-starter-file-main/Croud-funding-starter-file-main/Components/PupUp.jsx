import React, { useState, useEffect } from "react";

const PupUp = ({ setOpenModel, donate, donateFunction, getDonations, showToast }) => {
  // State for the donation amount and all retrieved donation data
  const [amount, setAmount] = useState("");
  const [allDonationData, setallDonationData] = useState();
  const [isDonating, setIsDonating] = useState(false);
  const [donationError, setDonationError] = useState("");

  // Async function to create a new donation
  const createDination = async () => {
    setDonationError("");
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setDonationError("Please enter a valid donation amount greater than 0.");
      return;
    }
    setIsDonating(true);
    try {
      // Call the external donate function
      const data = await donateFunction(donate.pId, amount);

      console.log(data); // Log success data
      showToast("Donation successful!", "success");
      setOpenModel(false); // Close modal on success

    } catch (error) {
      console.error(error);
      const errorMessage = error.message || "Donation failed. Please try again.";
      setDonationError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsDonating(false);
    }
  }; // End of createDination function

  // useEffect to fetch the list of donations when the component mounts
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const donationData = await getDonations(donate.pId);
        setallDonationData(donationData);
      } catch (error) {
        console.error("Failed to fetch donations:", error);
        setallDonationData([]); // Set empty on error
      }
    };

    if (donate?.pId !== undefined) {
      fetchDonations();
    }
  }, [donate.pId, getDonations]); // Dependency array: Re-run if `donate.pId` or `getDonations` changes

  return (
    <>
      {/* Modal Overlay and Container */}
      <div
        className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none"
      >
        {/* Modal Dialog */}
        <div className="relative w-auto my-6 mx-auto max-w-3xl">
          {/*content*/}
          <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
            {/*header*/}
            <div className="flex items-start justify-between p-5 border-b border-solid border-slate-200 rounded-t">
              <h3 className="text-3xl font-semibold">
                {donate.title}
              </h3>
              {/* Close Button in header */}
              <button
                className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                onClick={() => setOpenModel(false)}
              >
                <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                  ×
                </span>
              </button>
            </div>
            {/*body*/}
            <div className="relative p-6 flex-auto">
              <p className="my-4 text-slate-500 text-lg leading-relaxed">
                {donate.description}
              </p>

              {/* Donation Input Form */}
              <input
                onChange={(e) => setAmount(e.target.value)}
                placeholder="amount in ETH"
                required
                type="number"
                min="0.01"
                step="0.01"
                className="flex-grow w-full h-12 px-4 mb-2 transition duration-200 bg-white border border-gray-300 rounded shadow-sm appearance-none focus:border-deep-purple-accent-400 focus:outline-none focus:shadow-outline"
                id="donationAmount"
                name="donationAmount"
              />

              {/* Donation Error */}
              {donationError && (
                <div className="mb-2 text-red-600 text-sm">
                  {donationError}
                </div>
              )}
              {/* Placeholder for other form fields/button/etc. */}

              {/* List of Donations */}
              {allDonationData?.map((donate, i) => (
                <p
                  key={i}
                  className="my-4 text-slate-500 text-lg leading-relaxed"
                >
                  {i + 1}: {donate.donation} {""}
                  {donate.donator.slice(0, 35)}
                </p>
              ))}
            </div>

            {/*footer*/}
            <div className="flex items-center justify-end p-6 border-t border-solid border-slate-200 rounded-b">
              
              {/* Close Button in footer */}
              <button
                className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                type="button"
                onClick={() => setOpenModel(false)}
              >
                Close
              </button>
              
              {/* Donate Button */}
              <button
                className={`background text-white active:bg-emerald-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 ${
                  isDonating ? "opacity-50 cursor-not-allowed" : ""
                }`}
                type="button"
                onClick={() => createDination()}
                disabled={isDonating}
              >
                {isDonating ? "Donating..." : "Donate"}
              </button>

            </div>
          </div>
        </div>
      </div>
      {/* Backdrop */}
      <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
    </>
  );
};

export default PupUp;