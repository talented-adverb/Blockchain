import React, { useContext } from "react";
import { CrowdFundingContext } from "../Context/CrowdFunding";

const Card = ({ allcampaign, setOpenModel, setDonate, title, loading, showToast }) => {
  const { currentAccount } = useContext(CrowdFundingContext);
  console.log(allcampaign);

  // Default campaigns to show when no campaigns are available
  const defaultCampaigns = [
    {
      title: "Sample Campaign 1",
      description: "This is a sample crowdfunding campaign. Start your own campaign to see it here!",
      target: "10",
      amountCollected: "0",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isDefault: true,
    },
    {
      title: "Sample Campaign 2",
      description: "Another example of a campaign. Create campaigns to help others achieve their goals.",
      target: "5",
      amountCollected: "0",
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      isDefault: true,
    },
    {
      title: "Sample Campaign 3",
      description: "Crowdfunding helps bring ideas to life. Join the community by creating your campaign.",
      target: "20",
      amountCollected: "0",
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      isDefault: true,
    },
  ];

  // Utility function to calculate the number of days left until a deadline
  const daysLeft = (deadline) => {
    // Calculate the difference in milliseconds
    const difference = new Date(deadline).getTime() - Date.now();

    // Convert milliseconds difference to days
    const remainingDays = difference / (1000 * 3600 * 24);

    // Return the number of days fixed to 0 decimal places, handle negative
    return Math.max(0, remainingDays).toFixed(0);
  };

  // Determine which campaigns to display
  const campaignsToShow = allcampaign && allcampaign.length > 0 ? allcampaign : defaultCampaigns;

  return (
    <div className="px-4 py-16 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8 lg:py-20">
      <p className="py-16 text-2xl font-bold leading-5">{title}</p>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <span className="ml-4 text-lg">Loading campaigns...</span>
        </div>
      ) : (
        /* Grid container for campaigns */
        <div className="grid gap-5 lg:grid-cols-3 sm:max-w-sm sm:mx-auto lg:max-w-full">
          {/* Map over campaignsToShow data to render individual cards */}
          {campaignsToShow?.map((campaign, i) => (
              <div
                key={i}
                // Set up click handler to set the campaign data and open the donation modal (only for real campaigns)
                onClick={() => {
                  console.log("Card clicked:", campaign);
                  if (!campaign.isDefault) {
                    if (!currentAccount) {
                      showToast("Please connect your wallet first to donate.", "error");
                      return;
                    }
                    console.log("Opening donation modal for:", campaign.title);
                    setDonate(campaign);
                    setOpenModel(true);
                  } else {
                    console.log("Default campaign, not opening modal");
                  }
                }}
                // Styling for the individual card container
                className={`${campaign.isDefault ? 'cursor-default' : 'cursor-pointer'} border overflow-hidden transition-all duration-300 bg-white rounded hover:shadow-lg hover:scale-105 hover:-translate-y-1`}
              >
                {/* Campaign Image */}
                <a href="/" aria-label="Article">
                  <img
                    src="https://images.pexels.com/photos/932638/pexels-photo-932638.jpeg?auto=compress&cs=tinysrgb&dpr=3&h=750&w=1260"
                    className="object-cover w-full h-64 rounded"
                    alt=""
                  />
                </a>

                {/* Campaign Details Section */}
                <div className="py-5 pl-2">
                  <p className="mb-2 text-xs font-semibold text-gray-600 uppercase">
                    Days Left: {daysLeft(campaign.deadline)}
                  </p>

                  <a
                    href="/"
                    aria-label="Article"
                    className="inline-block mb-3 text-black transition-colors duration-200 hover:text-deep-purple-accent-700"
                  >
                    <p className="text-2xl font-bold leading-5">{campaign.title}</p>
                  </a>

                  <p className="mb-4 text-gray-700">{campaign.description}</p>

                  {/* Financial Metrics */}
                  <div className="flex space-x-4">
                    <p className="font-semibold">Target: {campaign.target} ETH</p>
                    <p className="font-semibold">Raised: {campaign.amountCollected} ETH</p>
                  </div>

                  {/* Progress Bar */}
                  {!campaign.isDefault && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min((parseFloat(campaign.amountCollected) / parseFloat(campaign.target)) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {((parseFloat(campaign.amountCollected) / parseFloat(campaign.target)) * 100).toFixed(1)}% funded
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
      )}
    </div>
  );
};

export default Card;