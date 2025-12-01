import React, { useState } from "react";

const Hero = ({ titleData, createCampaign, showToast }) => {
  // State to manage the input fields for a new campaign
  const [campaign, setCampaign] = useState({
    title: "",
    description: "",
    amount: "",
    deadline: "",
  });

  // State for loading and error handling
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  // Async function to handle campaign submission
  const createNewCampaign = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!campaign.title || !campaign.description || !campaign.amount || !campaign.deadline) {
      setError("Please fill in all fields.");
      return;
    }
    if (isNaN(campaign.amount) || parseFloat(campaign.amount) <= 0) {
      setError("Please enter a valid target amount greater than 0.");
      return;
    }
    if (new Date(campaign.deadline) <= new Date()) {
      setError("Deadline must be in the future.");
      return;
    }

    setIsCreating(true);
    try {
      // Calls the createCampaign function passed from the parent component (Context)
      const data = await createCampaign(campaign);
      console.log("Campaign created:", data);
      showToast("Campaign created successfully!", "success");
      // Reset form
      setCampaign({
        title: "",
        description: "",
        amount: "",
        deadline: "",
      });
    } catch (error) {
      console.error("Create campaign error:", error);
      const errorMessage = error.message || "Failed to create campaign. Please try again.";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative">
      {/* Background Image Section */}
      <span className="coverLine"></span> 
      <img
        src="https://images.pexels.com/photos/3228766/pexels-photo-3228766.jpeg?auto=compress&amp;cs=tinysrgb&amp;dpr=2&amp;h=750&amp;w=1260"
        className="absolute inset-0 object-cover w-full h-full"
        alt=""
      />
      
      {/* Background Overlay and Decorative SVG */}
      <div className="relative bg-opacity-75 backgroundMain">
        <svg
          className="absolute inset-x-0 bottom-0 text-white"
          viewBox="0 0 1160 163"
        >
          <path
            fill="currentColor"
            d="M-164 13L-104 39.7C-44 66 76 120 196 141C316 162 436 152 556 119.7C676 88 796 34 916 13C1036 -8 1156 2 1216 7.7L1276 13V162.5H-164V13Z"
          />
        </svg>

        {/* Hero Content Section */}
        <div className="relative px-4 py-16 mx-auto overflow-hidden sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8 lg:py-20">
          <div className="flex flex-col items-center justify-between xl:flex-row">
            
            {/* 1. Text Content / Left Side (w-7/12) */}
            <div className="w-full max-w-xl mb-12 xl:mb-0 xl:pr-16 xl:w-7/12">
              <h2 className="max-w-lg mb-6 font-sans text-3xl font-bold tracking-tight text-white sm:text-5xl sm:leading-none">
                RaiseX <br className="hidden md:block" />
                TrustFunded
              </h2>
              <p className="max-w-xl mb-4 text-base text-gray-200 md:text-lg">
               A decentralized platform where anyone can create a fundraising campaign and receive donations directly through blockchain.
              </p>
              
              {/* 'Learn More' Link with SVG Arrow */}
              <a 
                href="/" 
                aria-label=""
                className="inline-flex items-center font-semibold tracking-wider transition-colors duration-200 text-teal-accent-400 hover:text-teal-accent-700 text-gray-200"
              >
                Learn more
                <svg
                  className="inline-block w-3 ml-2"
                  fill="currentColor"
                  viewBox="0 0 12 12"
                >
                  <path d="M9.707,5.293l-5-5A1,1,0,0,0,3.293,1.707L7.586,6,3.293,10.293a1,1,0,1,0,1.414,1.414l5-5A1,1,0,0,0,9.707,5.293Z" />
                </svg>
              </a>
            </div>

            {/* 2. Campaign Form / Right Side (w-5/12) */}
            <div className="w-full max-w-xl xl:px-8 xl:w-5/12">
              <div className="bg-white rounded shadow-2xl p-7 sm:p-10">
                <h3 className="mb-4 text-xl font-semibold sm:text-center sm:mb-6 sm:text-2xl">
                  Campaign
                </h3>
                <form onSubmit={createNewCampaign}> 
                  
                  {/* Title Field (from previous step) */}
                  <div className="mb-1 sm:mb-2">
                    <label 
                      htmlFor="firstName"
                      className="inline-block mb-1 font-medium"
                    >
                      Title
                    </label>
                    <input
                      onChange={(e) =>
                        setCampaign({ 
                          ...campaign,
                          title: e.target.value,
                        })
                      }
                      placeholder="title"
                      required
                      type="text"
                      className="flex-grow w-full h-12 px-4 mb-2 transition duration-200 bg-white border border-gray-300 rounded shadow-sm appearance-none focus:border-deep-purple-accent-400 focus:outline-none focus:shadow-outline"
                      id="firstName"
                      name="firstName"
                    />
                  </div>

                  {/* Description Field (from previous step) */}
                  <div className="mb-1 sm:mb-2">
                    <label 
                      htmlFor="lastName"
                      className="inline-block mb-1 font-medium"
                    >
                      Description
                    </label>
                    <input
                      onChange={(e) =>
                        setCampaign({
                          ...campaign,
                          description: e.target.value,
                        })
                      }
                      placeholder="description"
                      required
                      type="text"
                      className="flex-grow w-full h-12 px-4 mb-2 transition duration-200 bg-white border border-gray-300 rounded shadow-sm appearance-none focus:border-deep-purple-accent-400 focus:outline-none focus:shadow-outline"
                      id="lastName"
                      name="lastName"
                    />
                  </div>
                  
                  {/* Target Amount Field (New from images) */}
                  <div className="mb-1 sm:mb-2">
                    <label 
                      htmlFor="email" // Mismatched ID/Name is present in source images, but kept for authenticity
                      className="inline-block mb-1 font-medium"
                    >
                      Target Amount
                    </label>
                    <input
                      onChange={(e) =>
                        setCampaign({
                          ...campaign,
                          amount: e.target.value,
                        })
                      }
                      placeholder="amount"
                      required
                      type="text"
                      className="flex-grow w-full h-12 px-4 mb-2 transition duration-200 bg-white border border-gray-300 rounded shadow-sm appearance-none focus:border-deep-purple-accent-400 focus:outline-none focus:shadow-outline"
                      id="email"
                      name="email"
                    />
                  </div>
                  
                  {/* Deadline Field (New from images) */}
                  <div className="mb-1 sm:mb-2">
                    <label 
                      htmlFor="email" // Mismatched ID/Name is present in source images, but kept for authenticity
                      className="inline-block mb-1 font-medium"
                    >
                      Deadline
                    </label>
                    <input
                      onChange={(e) =>
                        setCampaign({
                          ...campaign,
                          deadline: e.target.value,
                        })
                      }
                      placeholder="Date"
                      required
                      type="date"
                      className="flex-grow w-full h-12 px-4 mb-2 transition duration-200 bg-white border border-gray-300 rounded shadow-sm appearance-none focus:border-deep-purple-accent-400 focus:outline-none focus:shadow-outline"
                      id="email"
                      name="email"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mt-2 mb-2 text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Submit Button (New from images) */}
                  <div className="mt-4 mb-2 sm:mb-4">
                    <button
                      onClick={(e) => createNewCampaign(e)}
                      type="submit"
                      disabled={isCreating}
                      className={`inline-flex items-center justify-center w-full h-12 px-6 font-medium tracking-wide text-white transition duration-200 rounded shadow-md focus:shadow-outline focus:outline-none ${
                        isCreating
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-deep-purple-accent-400 hover:bg-deep-purple-accent-700 newColor"
                      }`}
                    >
                      {isCreating ? "Creating..." : "Create Campaign"}
                    </button>
                  </div>

                  {/* Note: Missing closing tags if there were any privacy/terms notes (not visible in images) */}
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;