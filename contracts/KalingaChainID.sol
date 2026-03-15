// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title KalingaChainID
 * @notice ERC-4973-style Account-Bound Token for Filipino Seniors and PWDs.
 *         Tokens are soulbound, non-transferable, and mapped to one wallet.
 */
contract KalingaChainID {
    address private constant DEFAULT_MERCHANT = 0x0dc67924399d1AF0fdeA6e5050bCF64690ADa50d;
    string public constant name = "KalingaChain Benefit ID";
    string public constant symbol = "KCBID";

    uint256 private _nextTokenId = 1;

    // One token per wallet identity.
    mapping(address => uint256) private _tokenOf;
    mapping(uint256 => address) private _ownerOf;
    mapping(uint256 => bool) private _revoked;

    struct VerificationRecord {
        address merchant;
        address beneficiary;
        uint256 timestamp;
        bool eligibleAtCheck;
    }

    VerificationRecord[] private _verificationLogs;
    uint256 public totalBeneficiaries;

    event IDIssued(address indexed beneficiary, uint256 indexed tokenId);
    event IDRevoked(address indexed beneficiary, uint256 indexed tokenId);
    event Attest(address indexed to, uint256 indexed tokenId);
    event Revoke(address indexed to, uint256 indexed tokenId);
    event VerificationLogged(
        address indexed merchant,
        address indexed beneficiary,
        bool eligible,
        uint256 timestamp
    );

    address private _owner;
    mapping(address => bool) public admins;
    mapping(address => bool) public merchants;

    modifier onlyOwner() {
        require(msg.sender == _owner, "Ownable: caller is not admin");
        _;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender], "Access denied: admin only");
        _;
    }

    modifier onlyMerchant() {
        require(merchants[msg.sender], "Access denied: merchant only");
        _;
    }

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address admin) {
        require(admin != address(0), "Invalid admin");
        _owner = admin;
        admins[admin] = true;
        merchants[DEFAULT_MERCHANT] = true;
        emit OwnershipTransferred(address(0), admin);
    }

    function owner() external view returns (address) {
        return _owner;
    }

    /**
     * @notice ERC-4973-like interface support marker.
     */
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        // IERC165 = 0x01ffc9a7
        // IERC4973 = 0xeb72bb7c
        return interfaceId == 0x01ffc9a7 || interfaceId == 0xeb72bb7c;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        address previous = _owner;
        _owner = newOwner;
        admins[newOwner] = true;
        emit OwnershipTransferred(previous, newOwner);
    }

    function setAdmin(address account, bool isEnabled) external onlyOwner {
        require(account != address(0), "Invalid admin");
        admins[account] = isEnabled;
    }

    function setMerchant(address account, bool isEnabled) external onlyOwner {
        require(account != address(0), "Invalid merchant");
        merchants[account] = isEnabled;
    }

    /**
     * @notice Issue a non-transferable identity token to beneficiary.
     * @dev Only LGU admin (owner) can call.
     */
    function issueID(address beneficiary) external onlyAdmin returns (uint256 tokenId) {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(!verifyEligibility(beneficiary), "Already has valid ID");

        tokenId = _nextTokenId++;
        _tokenOf[beneficiary] = tokenId;
        _ownerOf[tokenId] = beneficiary;
        _revoked[tokenId] = false;
        totalBeneficiaries += 1;

        emit IDIssued(beneficiary, tokenId);
        emit Attest(beneficiary, tokenId);
    }

    /**
     * @notice Revoke an identity token from beneficiary.
     * @dev Only LGU admin (owner) can call.
     */
    function revokeID(address beneficiary) external onlyAdmin {
        uint256 tokenId = _tokenOf[beneficiary];
        require(tokenId != 0, "No token found");
        require(!_revoked[tokenId], "Already revoked");

        _revoked[tokenId] = true;
        totalBeneficiaries -= 1;
        emit IDRevoked(beneficiary, tokenId);
        emit Revoke(beneficiary, tokenId);
    }

    function balanceOf(address user) external view returns (uint256) {
        return verifyEligibility(user) ? 1 : 0;
    }

    /**
     * @notice Optional ERC-4973 burn.
     * @dev Token owner (beneficiary) or admin can burn.
     */
    function burn(uint256 tokenId) external {
        address tokenOwner = _ownerOf[tokenId];
        require(tokenOwner != address(0), "Invalid token");
        require(msg.sender == tokenOwner || msg.sender == _owner, "Not authorized");
        require(!_revoked[tokenId], "Already revoked");

        _revoked[tokenId] = true;
        totalBeneficiaries -= 1;
        emit IDRevoked(tokenOwner, tokenId);
        emit Revoke(tokenOwner, tokenId);
    }

    /**
     * @notice Returns true if wallet has an active (non-revoked) ID.
     */
    function verifyEligibility(address user) public view returns (bool) {
        uint256 tokenId = _tokenOf[user];
        if (tokenId == 0) return false;
        return _ownerOf[tokenId] == user && !_revoked[tokenId];
    }

    /**
     * @notice Record merchant verification check.
     * @dev Merchant must log as sender to prevent spoofed merchant entries.
     */
    function logVerification(address merchant, address beneficiary) external onlyMerchant {
        require(merchant == msg.sender, "Merchant must be caller");
        require(beneficiary != address(0), "Invalid beneficiary");

        bool eligible = verifyEligibility(beneficiary);
        uint256 timestamp = block.timestamp;

        _verificationLogs.push(
            VerificationRecord({
                merchant: merchant,
                beneficiary: beneficiary,
                timestamp: timestamp,
                eligibleAtCheck: eligible
            })
        );

        emit VerificationLogged(merchant, beneficiary, eligible, timestamp);
    }

    function tokenOf(address user) external view returns (uint256) {
        return _tokenOf[user];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        return _ownerOf[tokenId];
    }

    function isRevoked(uint256 tokenId) external view returns (bool) {
        return _revoked[tokenId];
    }

    function getVerificationLogCount() external view returns (uint256) {
        return _verificationLogs.length;
    }

    function getVerificationLog(
        uint256 index
    )
        external
        view
        returns (address merchant, address beneficiary, uint256 timestamp, bool eligibleAtCheck)
    {
        require(index < _verificationLogs.length, "Index out of bounds");
        VerificationRecord memory record = _verificationLogs[index];
        return (record.merchant, record.beneficiary, record.timestamp, record.eligibleAtCheck);
    }
}
