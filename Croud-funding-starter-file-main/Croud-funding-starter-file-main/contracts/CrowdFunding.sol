// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract CrowdFunding {
    struct Campaign {
        address owner;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 amountCollected;
        address[] donators;
        uint256[] donations;
    }

    mapping(uint256 => Campaign) public campaigns;
    uint256 public numberOfCampaigns = 0;

    function createCampaign(
        address _owner,
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline
    ) public returns (uint256) {
        // deadline must be in the future
        require(_deadline > block.timestamp, "The deadline should be a date in the future.");

        // create empty storage slot for this campaign index
        Campaign storage campaign = campaigns[numberOfCampaigns];

        campaign.owner = _owner;
        campaign.title = _title;
        campaign.description = _description;
        campaign.target = _target;
        campaign.deadline = _deadline;
        campaign.amountCollected = 0;
        // donators and donations are dynamic arrays already initialized empty in storage

        numberOfCampaigns++;

        return numberOfCampaigns - 1;
    }

    function donateToCampaign(uint256 _id) public payable {
        require(_id < numberOfCampaigns, "Campaign does not exist.");
        require(msg.value > 0, "Donation must be greater than 0.");

        uint256 amount = msg.value;
        Campaign storage campaign = campaigns[_id];

        campaign.donators.push(msg.sender);
        campaign.donations.push(amount);

        // try to forward funds to campaign owner
        (bool sent, ) = payable(campaign.owner).call{value: amount}("");
        if (sent) {
            campaign.amountCollected += amount;
        } else {
            // if transfer failed, revert so funds aren't lost
            revert("Failed to send Ether to owner.");
        }
    }

    function getDonators(uint256 _id) public view returns (address[] memory, uint256[] memory) {
        require(_id < numberOfCampaigns, "Campaign does not exist.");
        return (campaigns[_id].donators, campaigns[_id].donations);
    }

    // Return a summary list of campaigns (without copying dynamic arrays from storage)
    function getCampaigns()
        public
        view
        returns (
            address[] memory owners,
            string[] memory titles,
            string[] memory descriptions,
            uint256[] memory targets,
            uint256[] memory deadlines,
            uint256[] memory amountCollected
        )
    {
        owners = new address[](numberOfCampaigns);
        titles = new string[](numberOfCampaigns);
        descriptions = new string[](numberOfCampaigns);
        targets = new uint256[](numberOfCampaigns);
        deadlines = new uint256[](numberOfCampaigns);
        amountCollected = new uint256[](numberOfCampaigns);

        for (uint256 i = 0; i < numberOfCampaigns; i++) {
            Campaign storage item = campaigns[i];
            owners[i] = item.owner;
            titles[i] = item.title;
            descriptions[i] = item.description;
            targets[i] = item.target;
            deadlines[i] = item.deadline;
            amountCollected[i] = item.amountCollected;
            // note: we omit donators/donations arrays here to avoid copying nested dynamic arrays
        }
    }
}
