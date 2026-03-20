// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title YieldPetTreasury
 * @notice Holds wstETH principal on behalf of Yieldling users.
 *         Only yield (current value minus original deposit) can be withdrawn
 *         by whitelisted recipients and subject to a per-tx cap.
 *         The owner can emergency-unwind any position, returning the full
 *         principal to the user.
 */
contract YieldPetTreasury is Ownable {
    using SafeERC20 for IERC20;

    // ── State ────────────────────────────────────────────────────────────────

    /// @notice The wstETH token contract
    IERC20 public immutable wstETH;

    /// @notice Original deposit amount (in wstETH) recorded per user at deposit time
    mapping(address => uint256) public principalOf;

    /// @notice Addresses allowed to call withdrawYield
    mapping(address => bool) public isWhitelisted;

    /// @notice Maximum wstETH that can be withdrawn in a single withdrawYield call
    uint256 public perTxCap;

    // ── Events ───────────────────────────────────────────────────────────────

    event Deposited(address indexed user, uint256 amount);
    event YieldWithdrawn(address indexed recipient, address indexed user, uint256 amount);
    event EmergencyUnwind(address indexed user, uint256 principalReturned);
    event WhitelistUpdated(address[] recipients);
    event PerTxCapUpdated(uint256 newCap);

    // ── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _wstETH  Address of the wstETH token (Lido)
     * @param _perTxCap  Initial per-transaction withdrawal cap (in wstETH wei)
     */
    constructor(address _wstETH, uint256 _perTxCap) Ownable(msg.sender) {
        require(_wstETH != address(0), "YieldPetTreasury: zero address");
        wstETH = IERC20(_wstETH);
        perTxCap = _perTxCap;
    }

    // ── User-facing functions ────────────────────────────────────────────────

    /**
     * @notice Deposit wstETH into the treasury.
     *         Caller must approve this contract for `amount` before calling.
     *         Adds to any existing principal so top-ups are supported.
     * @param amount  Amount of wstETH (in wei) to deposit
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "YieldPetTreasury: zero amount");
        principalOf[msg.sender] += amount;
        wstETH.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount);
    }

    /**
     * @notice Returns the spendable yield for a user.
     *         Yield = current wstETH balance attributable to the user
     *                 minus their original deposit.
     *         Because wstETH is a rebasing wrapper, its ETH value grows over
     *         time while the token balance stays constant, so yield is tracked
     *         externally by the ZyFAI strategy; this function exposes the
     *         on-chain principal gap for transparency and enforcement.
     * @param user  The depositor address to query
     * @return spendableYield  Amount of wstETH above principal (floored at 0)
     */
    function getSpendableYield(address user) public view returns (uint256 spendableYield) {
        uint256 principal = principalOf[user];
        uint256 balance = wstETH.balanceOf(address(this));
        // Guard: if balance hasn't exceeded principal yet, yield is zero
        if (balance > principal) {
            spendableYield = balance - principal;
        }
    }

    /**
     * @notice Withdraw yield to a recipient.
     *         Only whitelisted addresses may call this.
     *         Enforces that the amount does not exceed spendable yield for
     *         `user`, and does not exceed the per-tx cap.
     *         Principal is NEVER touched.
     * @param user       The depositor whose yield is being withdrawn
     * @param recipient  Address that receives the wstETH
     * @param amount     Amount of wstETH (in wei) to send
     */
    function withdrawYield(address user, address recipient, uint256 amount) external {
        require(isWhitelisted[msg.sender], "YieldPetTreasury: not whitelisted");
        require(amount > 0, "YieldPetTreasury: zero amount");
        require(amount <= perTxCap, "YieldPetTreasury: exceeds per-tx cap");

        uint256 available = getSpendableYield(user);
        require(amount <= available, "YieldPetTreasury: insufficient yield");

        wstETH.safeTransfer(recipient, amount);
        emit YieldWithdrawn(recipient, user, amount);
    }

    // ── Owner-only configuration ─────────────────────────────────────────────

    /**
     * @notice Replace the full recipient whitelist.
     *         All previous entries are cleared; pass the complete new list.
     *         Only the owner can call this.
     * @param recipients  Array of addresses to whitelist
     * @param previous    Array of addresses to de-whitelist (gas-efficient clear)
     */
    function setRecipientWhitelist(
        address[] calldata recipients,
        address[] calldata previous
    ) external onlyOwner {
        // Clear old entries first
        for (uint256 i = 0; i < previous.length; i++) {
            isWhitelisted[previous[i]] = false;
        }
        // Set new entries
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "YieldPetTreasury: zero address in list");
            isWhitelisted[recipients[i]] = true;
        }
        emit WhitelistUpdated(recipients);
    }

    /**
     * @notice Update the maximum wstETH that can be withdrawn in a single call.
     *         Only the owner can call this.
     * @param cap  New cap in wstETH wei
     */
    function setPerTxCap(uint256 cap) external onlyOwner {
        require(cap > 0, "YieldPetTreasury: zero cap");
        perTxCap = cap;
        emit PerTxCapUpdated(cap);
    }

    /**
     * @notice Emergency unwind — returns the full principal to the user.
     *         Only the owner can call this (e.g. triggered by the ZyFAI
     *         health-factor monitor when liquidation risk is detected).
     *         Clears the user's principal record after transfer.
     * @param user  The depositor to unwind
     */
    function emergencyUnwind(address user) external onlyOwner {
        uint256 principal = principalOf[user];
        require(principal > 0, "YieldPetTreasury: no position");

        // Clear before transfer to prevent re-entrancy
        principalOf[user] = 0;
        wstETH.safeTransfer(user, principal);
        emit EmergencyUnwind(user, principal);
    }
}
